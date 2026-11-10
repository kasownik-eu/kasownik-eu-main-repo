import { getPayload } from 'payload'

import config from '@payload-config'
import type { Operator } from '@/payload-types'

import { seedRegions } from './data/regions'

// Made-up content from the Transit Wireframe design (flagged as sample data on the page)
type OperatorData = Omit<Operator, 'id' | 'createdAt' | 'updatedAt' | 'cities'>
type Mode = 'tram' | 'bus' | 'metro'

const T3: Mode[] = ['tram', 'bus', 'metro']
const steps = (texts: string[]) => texts.map((text) => ({ text }))

const ticket = (
  category: 'single' | 'short' | 'long' | 'other',
  name: string,
  validity: string,
  scope: string,
  transportModes: Mode[],
  priceNormal: number,
  priceReduced: number | null,
  whereToBuy: string,
) => ({ category, name, validity, scope, transportModes, priceNormal, priceReduced, whereToBuy })

const pl: OperatorData = {
  name: 'Miejski Zarząd Transportu',
  slug: 'mzt-przykladowe',
  sampleData: true,
  shortName: 'MZT',
  label: 'Organizator transportu · przykład',
  description:
    'Organizator publicznego transportu w mieście i okolicznych gminach. Odpowiada za tramwaje, autobusy i metro, rozkłady jazdy oraz system biletowy.',
  websiteUrl: 'https://example.com',
  timetableUrl: 'https://example.com/rozklady',
  transportModes: T3,
  zoneCount: 3,
  currency: 'PLN',
  paymentInfo: 'PLN, karta, aplikacja',
  hotline: '00 000 00 00',
  servicePoint: 'ul. Przykładowa 1, pon.–pt. 8:00–16:00',
  verifiedAt: new Date().toISOString(),
  purchaseMethods: [
    {
      type: 'machine',
      title: 'Automat biletowy',
      subtitle: 'Przystanki, dworce i niektóre pojazdy',
      requiresValidation: true,
      buySteps: steps([
        'Znajdź automat na większym przystanku lub dworcu. Szukaj urządzenia z napisem „Bilety”.',
        'Dotknij ekranu, wybierz język, a potem rodzaj biletu.',
        'Zapłać kartą lub monetami i odbierz bilet z dolnej tacki.',
      ]),
      validationSteps: steps([
        'W pojeździe znajdź kasownik przy drzwiach.',
        'Włóż bilet do kasownika strzałką do przodu i poczekaj na dźwięk.',
        'Sprawdź, czy na bilecie widać datę i godzinę. Kasuj od razu po wejściu.',
      ]),
    },
    {
      type: 'app',
      title: 'Aplikacja mobilna',
      subtitle: 'Aplikacja „MZT Bilet” (przykład), wymaga konta',
      requiresValidation: true,
      buySteps: steps([
        'Pobierz aplikację i załóż konto.',
        'Wybierz bilet i potwierdź płatność.',
        'Bilet pojawi się w zakładce „Moje bilety”.',
      ]),
      validationSteps: steps([
        'Po wejściu do pojazdu otwórz bilet w aplikacji.',
        'Naciśnij „Aktywuj”. Bilet zacznie obowiązywać.',
        'Przy kontroli pokaż ekran z biletem i licznikiem czasu.',
      ]),
    },
    {
      type: 'office',
      title: 'Punkt obsługi',
      subtitle: 'Siedziba operatora, pon.–pt. 8:00–16:00',
      requiresValidation: true,
      buySteps: steps([
        'Przyjdź z dokumentem, jeśli kupujesz bilet ulgowy lub okresowy.',
        'Powiedz, jaki bilet potrzebujesz. Pracownik wystawi bilet i przyjmie płatność.',
        'Zapytaj o kartę miejską, jeśli jeździsz regularnie.',
      ]),
      validationSteps: steps([
        'Bilet papierowy kasuje się w kasowniku przy drzwiach pojazdu.',
        'Bilet na karcie miejskiej: przyłóż kartę do czytnika.',
        'Bilet okresowy nie wymaga kasowania za każdym razem.',
      ]),
    },
    {
      type: 'contactless',
      title: 'Karta bankowa lub telefon',
      subtitle: 'Płatność w pojeździe',
      requiresValidation: false,
      buySteps: steps([
        'Przy wejściu do pojazdu przyłóż kartę lub telefon do czytnika.',
        'Poczekaj na sygnał potwierdzenia.',
        'Do końca podróży nie wyrzucaj karty i nie wyłączaj telefonu.',
      ]),
      noValidationText:
        'Ten bilet jest ważny od przyłożenia karty. Niczego nie kasujesz. Przy kontroli przyłóż tę samą kartę lub telefon.',
    },
  ],
  tickets: [
    ticket('single', 'Bilet 20-minutowy', '20 min', 'Strefa A', T3, 3.4, 1.7, 'automat, aplikacja, kierowca'),
    ticket('single', 'Bilet 60-minutowy', '60 min', 'Strefa A', T3, 4.8, 2.4, 'automat, aplikacja'),
    ticket('single', 'Bilet 90-minutowy', '90 min', 'Strefy A+B', ['tram', 'bus'], 6.2, 3.1, 'automat, aplikacja'),
    ticket('short', 'Bilet 24-godzinny', '24 godziny', 'Strefa A', T3, 14, 7, 'automat, aplikacja, punkt obsługi'),
    ticket('short', 'Bilet 72-godzinny', '72 godziny', 'Strefa A', T3, 28, 14, 'automat, aplikacja, punkt obsługi'),
    ticket('short', 'Bilet weekendowy', 'pt 18:00 – pn 6:00', 'Strefy A+B', T3, 18, 9, 'aplikacja, punkt obsługi'),
    ticket('long', 'Bilet miesięczny', '30 dni', 'Strefa A', T3, 120, 60, 'aplikacja, punkt obsługi'),
    ticket('long', 'Bilet kwartalny', '90 dni', 'Strefa A', T3, 320, 160, 'aplikacja, punkt obsługi'),
    ticket('long', 'Bilet roczny', '365 dni', 'Strefa A', T3, 1100, 550, 'punkt obsługi'),
    ticket('other', 'Bilet rodzinny', '1 dzień', 'Strefa A', T3, 12, null, 'automat, aplikacja'),
    ticket('other', 'Bilet grupowy (od 10 osób)', '1 dzień', 'Strefa A', ['tram', 'bus'], 40, null, 'punkt obsługi'),
  ],
  luggage: [
    {
      item: 'Bagaż ręczny',
      note: 'do 60 × 40 × 25 cm',
      transportModes: T3,
      conditions: 'Trzymaj bagaż na kolanach lub pod siedzeniem. Nie blokuj przejścia.',
    },
    {
      item: 'Rower',
      note: '1 rower na pojazd',
      transportModes: T3,
      feeText: 'bezpłatnie poza szczytem',
      conditions: 'W szczycie (6:00–9:00, 15:00–18:00) wymagany bilet jednorazowy.',
      whereToBuy: 'automat, aplikacja',
    },
    {
      item: 'Pies',
      note: 'pod opieką opiekuna',
      transportModes: T3,
      conditions: 'W kagańcu i na smyczy. Psy asystujące zawsze bezpłatnie.',
    },
    {
      item: 'Wózek dziecięcy',
      note: 'także wózek inwalidzki',
      transportModes: T3,
      conditions: 'Zajmij miejsce oznaczone symbolem wózka.',
    },
  ],
  rulesNote:
    'Bilet ulgowy przysługuje m.in. uczniom, studentom i seniorom. Zabierz dokument potwierdzający uprawnienie (przykładowa zasada).',
  rulesUrl: 'https://example.com/regulamin',
  zones: {
    enabled: true,
    items: [
      { name: 'Strefa A', covers: 'Śródmieście i dzielnice centralne' },
      { name: 'Strefa B', covers: 'Gminy sąsiednie do 15 km od centrum' },
      { name: 'Strefa C', covers: 'Gminy aglomeracji do 30 km od centrum' },
    ],
    noteTitle: 'Lotnisko i pociągi',
    note: 'Lotnisko leży w strefie B. Bilet miejski nie obowiązuje w pociągach regionalnych (przykładowa zasada).',
  },
  sources: {
    items: [
      { label: 'Oficjalna strona operatora (przykład)', url: 'https://example.com' },
      { label: 'Cennik', url: 'https://example.com/cennik' },
    ],
    aiAssisted: true,
  },
}

// English values for localized fields; array rows are matched by position after the Polish create
const en = {
  label: 'Transport authority · example',
  description:
    'Organiser of public transport in the city and neighbouring municipalities. Runs trams, buses and the metro, timetables and the ticketing system.',
  paymentInfo: 'PLN, card, app',
  servicePoint: '1 Sample St, Mon–Fri 8:00–16:00',
  purchaseMethods: [
    {
      title: 'Ticket machine',
      subtitle: 'Stops, stations and some vehicles',
      buySteps: [
        'Find a machine at a larger stop or station. Look for a device labelled “Tickets”.',
        'Touch the screen, choose your language, then the ticket type.',
        'Pay by card or coins and take the ticket from the bottom tray.',
      ],
      validationSteps: [
        'Find the validator next to the doors in the vehicle.',
        'Insert the ticket arrow first and wait for the beep.',
        'Check that the date and time are printed. Validate right after boarding.',
      ],
    },
    {
      title: 'Mobile app',
      subtitle: '“MZT Ticket” app (example), account required',
      buySteps: ['Download the app and create an account.', 'Choose a ticket and confirm payment.', 'The ticket appears under “My tickets”.'],
      validationSteps: [
        'After boarding, open the ticket in the app.',
        'Tap “Activate”. The ticket becomes valid.',
        'During inspection, show the screen with the ticket and timer.',
      ],
    },
    {
      title: 'Customer service point',
      subtitle: 'Operator office, Mon–Fri 8:00–16:00',
      buySteps: [
        'Bring an ID if you are buying a reduced or season ticket.',
        'Say which ticket you need. Staff will issue it and take payment.',
        'Ask about a city card if you travel regularly.',
      ],
      validationSteps: [
        'Validate a paper ticket in the validator next to the vehicle doors.',
        'Ticket on a city card: tap the card on the reader.',
        'A season ticket does not need validating each time.',
      ],
    },
    {
      title: 'Bank card or phone',
      subtitle: 'Pay in the vehicle',
      buySteps: [
        'When boarding, tap your card or phone on the reader.',
        'Wait for the confirmation signal.',
        'Keep the card and leave the phone on until the end of the trip.',
      ],
      noValidationText:
        'This ticket is valid from the moment you tap. There is nothing to validate. During inspection, tap the same card or phone.',
    },
  ],
  tickets: [
    { name: '20-minute ticket', validity: '20 min', scope: 'Zone A', whereToBuy: 'machine, app, driver' },
    { name: '60-minute ticket', validity: '60 min', scope: 'Zone A', whereToBuy: 'machine, app' },
    { name: '90-minute ticket', validity: '90 min', scope: 'Zones A+B', whereToBuy: 'machine, app' },
    { name: '24-hour ticket', validity: '24 hours', scope: 'Zone A', whereToBuy: 'machine, app, service point' },
    { name: '72-hour ticket', validity: '72 hours', scope: 'Zone A', whereToBuy: 'machine, app, service point' },
    { name: 'Weekend ticket', validity: 'Fri 18:00 – Mon 6:00', scope: 'Zones A+B', whereToBuy: 'app, service point' },
    { name: 'Monthly ticket', validity: '30 days', scope: 'Zone A', whereToBuy: 'app, service point' },
    { name: 'Quarterly ticket', validity: '90 days', scope: 'Zone A', whereToBuy: 'app, service point' },
    { name: 'Annual ticket', validity: '365 days', scope: 'Zone A', whereToBuy: 'service point' },
    { name: 'Family ticket', validity: '1 day', scope: 'Zone A', whereToBuy: 'machine, app' },
    { name: 'Group ticket (10+ people)', validity: '1 day', scope: 'Zone A', whereToBuy: 'service point' },
  ],
  luggage: [
    { item: 'Hand luggage', note: 'up to 60 × 40 × 25 cm', conditions: 'Keep it on your lap or under the seat. Do not block the aisle.' },
    {
      item: 'Bike',
      note: '1 bike per vehicle',
      feeText: 'free off-peak',
      conditions: 'At peak times (6:00–9:00, 15:00–18:00) a single ticket is required.',
      whereToBuy: 'machine, app',
    },
    { item: 'Dog', note: 'with its owner', conditions: 'Muzzled and on a leash. Assistance dogs always travel free.' },
    { item: 'Pram', note: 'also wheelchairs', conditions: 'Use the space marked with the pram symbol.' },
  ],
  rulesNote:
    'Reduced tickets are available to pupils, students and seniors, among others. Bring a document proving eligibility (sample rule).',
  zones: [
    { name: 'Zone A', covers: 'City centre and central districts' },
    { name: 'Zone B', covers: 'Neighbouring municipalities up to 15 km from the centre' },
    { name: 'Zone C', covers: 'Metropolitan municipalities up to 30 km from the centre' },
  ],
  zoneNoteTitle: 'Airport and trains',
  zoneNote: 'The airport is in zone B. The city ticket is not valid on regional trains (sample rule).',
  sources: ['Official operator website (example)', 'Price list'],
}

// Keep localized step text aligned with the Polish rows (and their ids)
const localizeSteps = (rows: { text: string; id?: string | null }[] | null | undefined, texts?: string[]) =>
  rows?.map((row, i) => ({ ...row, text: texts?.[i] ?? row.text }))

type Relation = NonNullable<Operator['relatedOperators']>[number]
type LocalizedPair = { pl: string; en: string }

type MinimalOperator = Pick<OperatorData, 'name' | 'slug' | 'shortName' | 'transportModes'> & { cities?: string[] }

// Minimal carriers for the "related operators" section; relation and ticket validity are seen from MZT
const related: {
  data: MinimalOperator
  relation: Relation['relation']
  ticketValidity: Relation['ticketValidity']
  note: LocalizedPair
  coverage?: LocalizedPair
}[] = [
  {
    data: {
      name: 'Zarząd Komunikacji Sąsiednie Miasto',
      slug: 'zks-przykladowe',
      shortName: 'ZKS',
      transportModes: ['bus'],
      cities: ['miasto-sasiednie'],
    },
    relation: 'neighbourCity',
    ticketValidity: 'valid',
    note: { pl: 'Bilet miejski honorowany w całej sieci (przykład).', en: 'The city ticket is accepted across the network (example).' },
  },
  {
    data: { name: 'Przewozy Aglomeracyjne', slug: 'pa-przykladowe', shortName: 'PA', transportModes: ['bus', 'tram'] },
    relation: 'sharedArea',
    ticketValidity: 'partial',
    note: { pl: 'Tylko na wybranych liniach (przykład).', en: 'Only on selected lines (example).' },
    coverage: { pl: 'strefy B i C', en: 'zones B and C' },
  },
  {
    data: {
      name: 'Koleje Regionalne',
      slug: 'kr-przykladowe',
      shortName: 'KR',
      transportModes: ['train'],
      cities: ['miasto-przykladowe', 'przykladowice', 'miasto-sasiednie'],
    },
    relation: 'regional',
    ticketValidity: 'invalid',
    note: { pl: 'Potrzebny osobny bilet (przykład).', en: 'A separate ticket is needed (example).' },
    coverage: { pl: 'cały region', en: 'the whole region' },
  },
  {
    data: { name: 'Gminny Transport Zachód', slug: 'gt-przykladowe', shortName: 'GT', transportModes: ['bus'] },
    relation: 'sharedArea',
    ticketValidity: 'invalid',
    note: { pl: 'Własny cennik gminy (przykład).', en: "The municipality's own fares (example)." },
    coverage: { pl: 'strefa C', en: 'zone C' },
  },
  {
    data: { name: 'Busy Nocne', slug: 'bn-przykladowe', shortName: 'BN', transportModes: ['bus'] },
    relation: 'private',
    ticketValidity: 'invalid',
    note: { pl: 'Bilet kupowany u kierowcy (przykład).', en: 'Ticket bought from the driver (example).' },
    coverage: { pl: 'linie nocne', en: 'night lines' },
  },
]

// Serves Miasto Przykładowe without a relation entry on MZT: shown there as "in this city"
const sameCityOnly: MinimalOperator = {
  name: 'Linie Lotniskowe',
  slug: 'll-przykladowe',
  shortName: 'LL',
  transportModes: ['bus'],
  cities: ['miasto-przykladowe'],
}

// Two cities share MZT (the alias case); Miasto Przykładowe also has KR and LL (several operators per city)
// region: ISO 3166-2 code from the regions dictionary
const cities: { name: LocalizedPair; slug: string; region: string; primary: string }[] = [
  { name: { pl: 'Miasto Przykładowe', en: 'Sample City' }, slug: 'miasto-przykladowe', region: 'PL-24', primary: pl.slug },
  { name: { pl: 'Przykładowice', en: 'Przykładowice' }, slug: 'przykladowice', region: 'PL-24', primary: pl.slug },
  { name: { pl: 'Miasto Sąsiednie', en: 'Neighbour Town' }, slug: 'miasto-sasiednie', region: 'PL-24', primary: 'zks-przykladowe' },
]
const mztCities = ['miasto-przykladowe', 'przykladowice']

const payload = await getPayload({ config })
const regionIds = await seedRegions(payload)

// Find by slug, then update or create the Polish version
const upsert = async <C extends 'operators' | 'cities'>(collection: C, slug: string, data: Record<string, unknown>) => {
  const { docs } = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const args = { collection, data, locale: 'pl', depth: 0 } as const
  return docs[0]
    ? payload.update({ ...args, id: docs[0].id } as Parameters<typeof payload.update>[0])
    : payload.create(args as Parameters<typeof payload.create>[0])
}

// Cities first: operators link to them
const cityIds = new Map<string, number>()
for (const city of cities) {
  const region = regionIds.get(city.region)!
  const doc = await upsert('cities', city.slug, {
    name: city.name.pl,
    slug: city.slug,
    country: region.country,
    region: region.id,
  })
  await payload.update({
    collection: 'cities',
    id: doc.id,
    locale: 'en',
    depth: 0,
    data: { name: city.name.en },
  })
  cityIds.set(city.slug, doc.id)
}
const toCityIds = (slugs: string[] = []) => slugs.map((slug) => cityIds.get(slug)!)

const operatorIds = new Map<string, number>()
for (const data of [...related.map((r) => r.data), sameCityOnly]) {
  const doc = (await upsert('operators', data.slug, {
    ...data,
    cities: toCityIds(data.cities),
    sampleData: true,
    currency: 'PLN',
  })) as Operator
  operatorIds.set(data.slug, doc.id)
}

const operator = (await upsert('operators', pl.slug, {
  ...pl,
  cities: toCityIds(mztCities),
  relatedOperators: related.map((r) => ({
    operator: operatorIds.get(r.data.slug)!,
    relation: r.relation,
    ticketValidity: r.ticketValidity,
    note: r.note.pl,
    coverage: r.coverage?.pl ?? null,
  })),
})) as Operator
operatorIds.set(pl.slug, operator.id)

await payload.update({
  collection: 'operators',
  id: operator.id,
  locale: 'en',
  depth: 0,
  data: {
    label: en.label,
    description: en.description,
    paymentInfo: en.paymentInfo,
    servicePoint: en.servicePoint,
    purchaseMethods: operator.purchaseMethods?.map((method, i) => {
      const t = en.purchaseMethods[i]
      return {
        ...method,
        title: t?.title ?? method.title,
        subtitle: t?.subtitle ?? method.subtitle,
        buySteps: localizeSteps(method.buySteps, t?.buySteps),
        validationSteps: localizeSteps(method.validationSteps, t?.validationSteps),
        noValidationText: t?.noValidationText ?? method.noValidationText,
      }
    }),
    tickets: operator.tickets?.map((row, i) => ({ ...row, ...en.tickets[i] })),
    luggage: operator.luggage?.map((row, i) => ({ ...row, ...en.luggage[i] })),
    rulesNote: en.rulesNote,
    zones: {
      ...operator.zones,
      items: operator.zones?.items?.map((zone, i) => ({ ...zone, ...en.zones[i] })),
      noteTitle: en.zoneNoteTitle,
      note: en.zoneNote,
    },
    sources: {
      ...operator.sources,
      items: operator.sources?.items?.map((source, i) => ({ ...source, label: en.sources[i] ?? source.label })),
    },
    relatedOperators: operator.relatedOperators?.map((row, i) => ({
      ...row,
      note: related[i].note.en,
      coverage: related[i].coverage?.en ?? null,
    })),
  },
})

for (const city of cities) {
  await payload.update({
    collection: 'cities',
    id: cityIds.get(city.slug)!,
    depth: 0,
    data: { primaryOperator: operatorIds.get(city.primary)! },
  })
}

payload.logger.info(`Seeded ${operatorIds.size} operators and ${cities.length} cities in pl and en`)
process.exit(0)
