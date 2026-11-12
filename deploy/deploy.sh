#!/bin/sh
# Run by cron on the host: pulls the newest develop build from GitHub, switches to it,
# restarts the app and rolls back if the new release doesn't answer.
# Usage: REPO=owner/name HEALTH_URL=https://site/admin sh deploy.sh   (APP_DIR defaults to this folder)
set -eu

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")" && pwd)}"
BASE="https://github.com/${REPO:?REPO not set}/releases/download/develop-latest"
cd "$APP_DIR"
mkdir -p releases shared/media shared/.tmp tmp
mkdir shared/deploy.lock 2>/dev/null || exit 0 # another run is in progress
trap 'rm -rf shared/deploy.lock shared/bundle.tar.gz' EXIT

log() { echo "$(date -u '+%F %T') $*" >> shared/deploy.log; }
get() { if command -v curl >/dev/null; then curl -fsSL -o "$2" "$1"; else fetch -qo "$2" "$1"; fi; }
restart() { sleep 1; date > tmp/restart.txt; } # Passenger restarts when this file's mtime changes

# A new release is live once its own build's static file is served (the old process may still answer)
healthy() {
  build=$(cat "releases/$1/.next/BUILD_ID")
  origin=$(echo "$HEALTH_URL" | sed -E 's#^(https?://[^/]+).*#\1#')
  for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18; do
    get "$origin/_next/static/$build/_buildManifest.js" /dev/null 2>/dev/null &&
      get "$HEALTH_URL" /dev/null 2>/dev/null && return 0
    sleep 10
  done
  return 1
}

SHA=$(get "$BASE/version.txt" - 2>/dev/null | head -n 1)
[ -n "$SHA" ] || exit 0 # nothing published yet / GitHub unreachable: try again next run
echo "$SHA" | grep -Eq '^[0-9a-f]{40}$' || { log "bad version.txt"; exit 1; }
CURRENT=$(basename "$(readlink current 2>/dev/null || echo none)")
[ "$SHA" = "$CURRENT" ] || [ -f "shared/failed-$SHA" ] && exit 0

log "deploying $SHA (current: $CURRENT)"
get "$BASE/bundle-$SHA.tar.gz" shared/bundle.tar.gz
rm -rf "releases/$SHA" && mkdir "releases/$SHA"
tar -xzf shared/bundle.tar.gz -C "releases/$SHA"
ln -s ../../shared/media "releases/$SHA/media"
ln -s ../../shared/.tmp "releases/$SHA/.tmp"

ln -sfn "releases/$SHA" current
restart
if [ -z "${HEALTH_URL:-}" ] || healthy "$SHA"; then
  log "deployed $SHA"
  ls -1t releases | tail -n +4 | while read -r old; do rm -rf "releases/$old"; done # keep 3
else
  touch "shared/failed-$SHA"
  [ "$CURRENT" != none ] && ln -sfn "releases/$CURRENT" current && restart
  log "health check failed for $SHA, rolled back to $CURRENT (DB migrations are not reverted)"
  exit 1
fi
