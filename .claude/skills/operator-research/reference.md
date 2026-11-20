# Field rules

Texts marked `{pl, en}` are `{ "pl": "…", "en": "…" }`: Polish is required, write English too.

## operator.json header

| Field | Rule |
|---|---|
| `name` | Full official name as on the website / BIP, e.g. `Zarząd Dróg Miejskich i Komunikacji Publicznej w Bydgoszczy`. |
| `shortName` | The abbreviation the operator itself uses (`ZDMiKP`, `ZTM`, `MPK`), otherwise `null`. |
| `label` | `{pl, en}`, 2–4 words on the operator's role, optionally `· <city>`. Typical values: `Organizator transportu` / `Transport authority` (sets routes, fares, tickets), `Przewoźnik miejski` / `City carrier` (runs vehicles), `Przewoźnik regionalny` / `Regional carrier`, `Związek komunalny` / `Municipal transport union`, `Gminna komunikacja` / `Municipal bus service`. |
| `description` | `{pl, en}`, 2–3 plain sentences: who it is, which area it serves, which vehicles / what it is responsible for (routes, tickets). No marketing, no prices, no dates that will go stale. |
| `websiteUrl` | Home page, `https://`, canonical host (follow redirects). |
| `timetableUrl` | Official timetable / journey planner page of the operator, else `null`. |
| `transportModes` | Only values from the context's `transportModes` (`tram`, `bus`, `metro`, `train`, `trolleybus`, `ferry`), only modes the operator's tickets cover; order: most important first. Night buses, minibuses and replacement buses are `bus`; water trams are `ferry`. |
| `currency` | `PLN` for Polish operators. |
| `hotline` | Customer information phone number as published, e.g. `+48 52 582 27 44` or `19 115`; `null` if only an email exists. |
| `servicePoint` | `{pl, en}`, the main customer service point: address and opening hours in one line, e.g. `ul. Toruńska 174, pon.–pt. 7:00–18:00` / `174 Toruńska St, Mon–Fri 7:00–18:00`. |
| `paymentInfo` | `{pl, en}`, short list of accepted ways to pay, e.g. `gotówka, karta, BLIK, aplikacja` / `cash, card, BLIK, app`. |
| `logo` | `{ "file": "logo.svg", "alt": { "pl": "Logo ZDMiKP", "en": "ZDMiKP logo" } }`; the file must exist in `images/`. |

## Operator slug (discover)

Lowercase, digits and hyphens (no Polish letters): `<shortName or short name>-<main city>`, e.g. `zdmikp-bydgoszcz`,
`mpk-krakow`, `ztm-warszawa`, `koleje-slaskie`. Regional carriers without one city: just the short name.

## cities.json

- List the cities and municipalities (towns and gminy) where the operator runs or organises urban / suburban public
  transport, taken from its network / member-municipality list or route map. Do not list villages and stops.
- Regional carriers (railways, PKS-type buses): only the main hubs (voivodeship capitals and major towns with stations).
- Order: main city first, then alphabetically.
- City slug: the Polish name without diacritics, lowercase, hyphens for spaces: `Bydgoszcz` → `bydgoszcz`,
  `Białe Błota` → `biale-blota`; `Łódź` → `lodz`; `Kędzierzyn-Koźle` → `kedzierzyn-kozle`.
  Add the gmina/county only to tell same-named places apart, e.g. `nowa-wies-gmina-x`.
- **Reuse**: if the city already exists in the context's `cities`, copy its `slug` and `name` exactly (the loader
  rejects a different name for the same slug). Do not rename an existing city.
- `name`: `{ "pl": "Bydgoszcz" }`; add `en` only when the English name differs (`Warszawa` → `Warsaw`, `Kraków` →
  `Krakow`).
- `voivodeship`: only when the city lies in a different voivodeship than the operator's folder.
- `primary: true`: only where this operator is the city's main urban transport authority / carrier **and** no other
  operator listing that city (context `cities[].operators`) is already primary there. Otherwise omit it and mention the
  conflict in the report instead of changing another operator.

## Source pages for the LLM pipelines

Each entry: `{ "url": "https://…", "xpath": "//…" }` (`xpath` optional). The pipelines read the page's `<main>` (or
`<body>`) text, or only the XPath block. Use an XPath when the page has a lot of unrelated text (news, menus not in
`<nav>`, several sections); prefer stable ids/classes, e.g. `//div[@id='cennik']`, `//article`. Every entry must pass
`npm run -s research:check-source -- <url> "<xpath>"` and the output must contain the relevant content.

| Field | What qualifies |
|---|---|
| `tariffSources` | Price list (ticket types, prices, reduced fares), luggage/animal/bike fees, tariff rules or regulations page. Usually 1–3 pages. |
| `purchaseSources` | Where and how to buy tickets (machines, apps, kiosks, driver, contactless, SMS) and how to validate / activate them. |
| `zoneSources` | List or description of fare zones and which areas they cover, the zone map page. Empty array when the operator has no zones. |

HTML pages only: a PDF or a page that loads its content with JavaScript fails `check-source`; look for an HTML
equivalent and otherwise report it. Do not add the same URL twice to one list.

## sources.items

The official pages actually used, e.g. `{ "label": { "pl": "Oficjalna strona", "en": "Official website" }, "url": … }`,
`Cennik` / `Price list`, `Kontakt` / `Contact`, `Strefy` / `Zones`. In verify mode keep existing items that still
work and add new ones.
