# Builds the static site from data/ and serves out/ with nginx

FROM node:22.23.4-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM nginx:1.27-alpine AS runner
# trailingSlash exports pages as <path>/index.html; unknown paths get the exported 404 page
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  error_page 404 /404.html;\n  location / { try_files $uri $uri/ =404; }\n}\n' > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
