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
| `hotline` | Customer information phone number as published on the operator's official contact page, e.g. `+48 52 582 27 44` or `19 115`; `null` if only an email exists. Trusted as published, no evidence quote needed (same for `servicePoint`). |
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

## Source pages

Each entry: `{ "url": "https://…", "xpath": "//…" }` (`xpath` optional). The checker reads the page's `<main>` (or
`<body>`) text, or only the XPath block. Use an XPath when the page has a lot of unrelated text (news, menus not in
`<nav>`, several sections); prefer stable ids/classes, e.g. `//div[@id='cennik']`, `//article`. Every entry must pass
`npm run -s research:check-source -- <url> "<xpath>"` and the output must contain the relevant content.

| Field | What qualifies |
|---|---|
| `tariffSources` | Price list (ticket types, prices, reduced fares), tariff rules or regulations page. Usually 1–3 pages. |
| `luggageSources` | Rules and fees for luggage, bikes, animals, strollers (often the regulations; narrow with an XPath). |
| `purchaseSources` | Where and how to buy tickets (machines, apps, points of sale, driver, bank card, Metrokarta, SMS) **and** how a ride is started with them (paper ticket in the validator, QR code in the vehicle, card tap): one flow. |
| `zoneSources` | List or description of fare zones and which areas they cover, the zone map page. Empty array when the operator has no zones. |

HTML pages only: a PDF or a page that loads its content with JavaScript fails `check-source`; look for an HTML
equivalent and otherwise report it. Do not add the same URL twice to one list.

## sources.items

The official pages actually used, e.g. `{ "label": { "pl": "Oficjalna strona", "en": "Official website" }, "url": … }`,
`Cennik` / `Price list`, `Kontakt` / `Contact`, `Strefy` / `Zones`. In verify mode keep existing items that still
work and add new ones.

## tickets.json

- `tickets`: one row per ticket or ticket package a passenger buys to travel, one per table row of the price list.
  Not events, group offers on request, fines or fees; luggage is its own list.
- `name` (`{pl,en}`): as in the source; names must be unique. When the same name appears in several tables (paper vs.
  electronic, from validation vs. from purchase) add the difference in brackets, e.g. `Grupowy (bilet elektroniczny)`.
- `category`: from the validity: `single` up to 2 hours, `short` 24 hours to 7 days, `long` 30 days and more, `other`
  for everything else (also tickets with no stated validity). A fare that names only a time bracket ("do 5 minut")
  counts by its upper limit.
- `validity` (`{pl,en}`, short: `20 minut`, `30 dni`), `scope` (`{pl,en}`) on **every** ticket: what the ticket
  description or the zones (`zones.json`) say (a city, a zone, several zones, a line). When the description does not
  clearly define a scope, or the operator has no zones, the ticket is valid on the whole network: write
  `Cała sieć` / `Whole network`. A different scope only when the ticket's own description says so. `transportModes` only the operator's own modes (or omit), `priceNormal` / `priceReduced`
  numbers in the operator's currency as on the page (omit what the page does not state), `whereToBuy`: see below.
- `whereToBuy` (`{pl,en}`) follows from the form of the ticket, using only the purchase methods that exist in
  `purchase.json` (step 4), named as the operator names them:
  - the ticket description says it is electronic ("elektroniczny", "e-bilet", "mobilny", "w aplikacji", "imienny" on
    the account, "electronic", "mobile") → it can be bought through the **application**, with a **bank card**
    (`contactless`) and with the operator's **own card** (`metrokarta`), e.g. `aplikacja, karta płatnicza, Metrokarta`;
  - it says it is paper ("papierowy", "paper") → it can be bought in a **ticket machine** (`machine`) and at a **sales
    point** (`office`, incl. points of sale), e.g. `automat biletowy, punkt sprzedaży`;
  - a table heading that covers both forms ("papierowych i elektronicznych") → both lists;
  - the form is not stated → leave `whereToBuy` out. A page that names the channels explicitly beats this rule.
  Leave out a channel the operator has no purchase method for.
- `luggage`: one row per kind of thing carried, `type` one of `luggage | bike | pet | stroller | other`, `item` a short
  name (`Rower`), `note` limits in a few words, `fee` a number only when the page states a price (leave it out when
  carrying is free), `feeText` for a fee that is not a plain price (`bezpłatnie poza szczytem`), `conditions` the rules
  of exactly that type in at most 2 short sentences. A general rule ("not on seats") belongs only to the `luggage` row.
- `rulesNote` (max 2 sentences) and `rulesUrl` (the regulations page).
- Omit empty fields instead of writing `null`, `""` or `"-"`.

## zones.json

`enabled: false` (and no `items`) when the operator has no fare zones (one fare area, or time-based / flat fares only): then every ticket has the scope `Cała sieć` / `Whole network`. Otherwise `items`: `name` and `covers` (what the zone
covers, short). `map` is an image added by hand; keep it. `noteTitle` / `note` only for a rule the page states.

## purchase.json

An array, at most 6 methods, one per way to buy (except `other`): `type` is one of `machine`, `app`, `office`,
`contactless` (bank card or phone on the reader), `metrokarta` (the operator's own city card only), `driver`, `sms`,
`other`. Write a method only when a source describes it. `title` stays unset (the label comes from the type) unless the
operator has a name for it; `subtitle` is where or what exactly, e.g. the app names exactly as written on the page.

Buying and starting the ride are **one flow**: `steps` is a single ordered list (max 10, usually 3–6, at most 12 words
each, imperative, plain language for a first-time passenger):

```json
"steps": [
  { "kind": "buy", "text": { "pl": "Wybierz bilet i zapłać kartą.", "en": "Choose a ticket and pay by card." } },
  { "kind": "validate", "text": { "pl": "Po wejściu skasuj bilet w kasowniku.", "en": "Validate the ticket in the validator after boarding." } }
]
```

- `buy` steps first, then `validate` steps (what to do on board to start the ride: validator, QR code, card tap, and
  when). A method with no `validate` step is shown with the `validation` hint instead.
- `validation`: short hint kinds of how the ride is started with a ticket bought this way: `punch` (paper ticket in the
  validator), `qr` (scan the code in the vehicle), `tap` (card or phone on the reader), `none` (nothing to do, then
  `noValidationText` may say why). Only what a source states. Typical, only when the sources say so: machine/office/driver →
  `punch`, app → `qr` or `punch`, contactless/metrokarta → `tap`.
- Every step must be supported by a page sentence (its quote goes into the evidence). Never write a step the sources do
  not support; a method without sourced steps has just `type` (and `validation`).
- Never write `photos`; keep existing ones.

## evidence.json

```json
{
  "verifiedAt": "2026-11-20",
  "facts": [
    { "file": "tickets", "path": "tickets[0].priceNormal", "value": 3.4, "url": "https://…/cennik", "xpath": "//div[@id='cennik']", "quote": "Bilet 20-minutowy | 3,40 | 1,70" }
  ]
}
```

- `verifiedAt` = `today` from the context. `file`: `operator`, `tickets`, `purchase` or `zones`. `url` + `xpath` exactly as
  in one of the `*Sources` entries.
- `path` addresses the value inside that file: `tickets[3].priceNormal`, `tickets[3].priceReduced`, `luggage[0].fee`,
  `zones` → `items[1].name.pl`, `operator` → `servicePoint.pl`, `purchase[1].type`, `purchase[1].steps[2].text.pl`
  (`purchase` is addressed as `purchase[<index>]…`). `value` is exactly what the data holds there (number or string).
  Indexes are positions in the file: rewrite the whole evidence file whenever rows are added, removed or reordered.
- `quote`: copied **word for word** from the text `research:check-source -- <url> "<xpath>" --full` prints for that
  `url` + `xpath` (the checker collapses whitespace, nothing else). For a price take the whole table row as printed
  (`Bilet 20-minutowy | 3,40 | 1,70`), so it shows both the ticket and the number; for a number the quote must contain it
  (`3,40` or `3.4`). For a step, the one sentence it is based on.
- Cover: every `priceNormal` / `priceReduced`, every luggage `fee`, every purchase method (`type`) and step, every
  zone name, and `servicePoint` when it is on a source page. `hotline` and `servicePoint` from the official contact page need no
  evidence. Skip values that come from no page. `scope` and `whereToBuy` follow from rules (not quotes) and need none.
- Quote the part that changes when the fact changes; avoid long paragraphs (they break on a typo fix) and bare numbers
  (they match anywhere).
