# Słownik sposobów zakupu i kasowania biletów (ROBOCZY)

Status: iteracja 1, zadanie 1 (inwentaryzacja). Plik roboczy, nie źródło prawdy. Po zatwierdzeniu trafi do `data/` jako
słownik ze schematem Zod (zadanie 2).

Oznaczenia kroków: `[zakup]`, `[kasowanie]`. Kroku `[kontrola]` nie ma: kontrola biletów jest poza zakresem.

## A. Kanały sprzedaży

| # | Klucz roboczy | Opis | Kroki |
|---|---|---|---|
| 1 | `machine-print-unvalidated-ticket` | Automat biletowy stacjonarny (przystanek, stacja, węzeł), drukuje papierowy bilet do skasowania | zatwierdzone, patrz E |
| 2 | `machine-vehicle-print-validated-ticket` | Biletomat w pojeździe, który drukuje papierowy bilet już skasowany. NIE dotyczy: zakupu u kierowcy, płatności kartą w pojeździe (to `contactless` / `vehicle-terminal`), biletu do skasowania w kasowniku | zatwierdzone, patrz E |
| 2b | `machine-vehicle-print-unvalidated-ticket` | Biletomat w pojeździe, który drukuje papierowy bilet DO skasowania w kasowniku (np. Opole). NIE dotyczy: biletu już skasowanego, zakupu u kierowcy, płatności kartą w pojeździe | zatwierdzone, patrz E |
| 3 | `office` | Kasa, POK, punkt obsługi pasażera | zatwierdzone, patrz E |
| 4 | `partner-shop` | Kiosk, sklep, punkt partnerski (POS) | zatwierdzone (jak `office`), patrz E |
| 5 | `driver` (9 wariantów: płatność × kasowanie) | Kierowca / konduktor. Zwykle wydaje podstawowe bilety papierowe | do weryfikacji, patrz E |
| 6 | `app-operator` (3 warianty) | Aplikacja operatora (może mieć pakiety i bilety niedostępne gdzie indziej, np. Transport GZM) | do weryfikacji, patrz E |
| 7 | `app-third-party` (1 klucz) | Aplikacja zewnętrzna (SkyCash, moBiLET, zBiletem, jakdojade) | do weryfikacji, patrz E |
| 8 | `contactless` | Karta płatnicza / telefon, z podwariantami (niżej) | do podania |
| 9 | `city-card` | Karta miejska (Metrokarta, Opolka, KKM). Zapisujemy też: gdzie kartę uzyskać (zwykle punkt obsługi pasażera lub automat) i link do opisu (tylko w JSON, w HTML osobnym krokiem) | do podania |
| 10 | `web-shop` | Sklep / portal online (eKP, e-sklep) | do podania |
| 11 | `sms` | Bilet SMS-em | do podania |

### Podwarianty `contactless` (do potwierdzenia nazw)

- `card-as-city-card`: operator używa karty płatniczej jak karty miejskiej (system rozpoznaje kartę).
- `select-then-confirm`: zbliżasz kartę do kasownika, wybierasz bilet, zbliżasz ponownie, żeby kupić.
- `start-stop`: tap-in i tap-out. Ostrzeżenie: bez tap-out pobierana jest największa opłata za dany przejazd.
- `vehicle-terminal`: terminal w pojeździe (np. Open Payment System w Jaworznie): wybierasz bilet, zbliżasz kartę.

### Uwagi do `city-card`

- Bilet długoterminowy zakodowany na karcie nie wymaga zbliżania za każdym razem.
- Karta może też służyć do rejestracji przejazdu z pakietu.
- Karta może działać w trybie start/stop (tap-in / tap-out).

## B. Osobne wymiary (nie są sposobami zakupu)

- Metoda płatności: gotówka, karta, BLIK, przelew, SMS.
- Prowizja (dotyczy CAŁEJ części płatności, każdego kanału i typu płatności, nie tylko kierowcy): opcjonalny napis (string)
  w danych operatora przy typie płatności, np. „+1 zł” albo „+10%” (stała opłata lub procent). Jeśli występuje, strona go
  wyświetla. To dane operatora, nie tekst słownika.
- Nośnik biletu: papier, aplikacja, karta płatnicza, karta miejska (`ticketMediaTypes`).

## C. Sposoby kasowania / startu przejazdu

1. Kasownik: papierowy bilet wkładasz i przybijasz.
2. Karta płatnicza / telefon do kasownika, z podwariantami z sekcji A (`contactless`).
3. Karta miejska do kasownika: za każdym razem, albo wcale, gdy ma zakodowany bilet długoterminowy.
4. Skan kodu QR w pojeździe (aplikacja).
5. Wpisanie numeru taborowego pojazdu (zamiast QR).
6. Aktywacja biletu w aplikacji.
7. Zakończenie podróży (stop): w aplikacji lub tap-out kartą. Przy braku stop: największa opłata.
8. Rejestracja przejazdu z pakietu: w aplikacji, w kasowniku lub kartą miejską.
9. Bez kasowania: ważny od zakupu, od daty początku albo już skasowany przez biletomat.

## D. Dwie warstwy opisu (ustalone)

1. **Ogólna, per kanał**: sekcja „Jak kupić bilet i rozpocząć przejazd". Typowy przebieg `[zakup]` → `[kasowanie]` kanału,
   niezależny od konkretnego biletu.
2. **Per bilet × kanał**: doprecyzowanie lub nadpisanie warstwy 1 dla konkretnego biletu (np. GZM: jednorazowy w aplikacji
   = skan QR w pojeździe, okresowy = bez kasowania).

Warianty `contactless` (4) potwierdzone, telefon zawiera się w karcie. `app-operator` i `app-third-party` mają te same
kroki bazowe; pakiety i bilety dostępne tylko u operatora to wariant `app-operator`.

## E. Kroki kanałów (warstwa 1)

### `machine-print-unvalidated-ticket`

1. [zakup] Kup bilet w automacie biletowym.
2. [kasowanie] Po wejściu do pojazdu skasuj bilet i zachowaj do końca podróży.

### `machine-vehicle-print-unvalidated-ticket`

1. [zakup] Poszukaj automatu wewnątrz pojazdu.
2. [zakup] Kup bilet w automacie biletowym.
3. [kasowanie] Skasuj bilet w kasowniku w pojeździe.

### `office`

1. [zakup] Kup bilet w punkcie sprzedaży. W razie potrzeby dopytaj, czy ten bilet wymaga kasowania.
2. [kasowanie] Skasuj bilet jeśli tego wymaga (więcej informacji w części „Bilety i cennik”).

Decyzja: jeden klucz, bez podziału na skasowany/nieskasowany. Ten sam kanał sprzedaje bilety papierowe do skasowania, długookresowe
papierowe (wystarczy podpisać, bez kasowania) i inne; szczegóły kasowania opisuje karta biletu (warstwa 2). Dwa klucze
zrobiłyby chaos na liście opcji.

### `partner-shop`

Kroki jak w `office`:

1. [zakup] Kup bilet w punkcie sprzedaży. W razie potrzeby dopytaj czy ten bilet wymaga kasowania.
2. [kasowanie] Skasuj bilet jeśli tego wymaga (więcej informacji w części „Bilety i cennik”).

### `machine-vehicle-print-validated-ticket`

Używać TYLKO, gdy biletomat w pojeździe drukuje papierowy bilet automatycznie skasowany. Operator bez automatów poza
pojazdem nie dostaje `machine-print-unvalidated-ticket`.

1. [zakup] Poszukaj automatu wewnątrz pojazdu.
2. [zakup] Kup bilet w automacie biletowym.
3. [kasowanie] Bilet z biletomatu jest skasowany od razu po zakupie - nic więcej nie rób.

### `driver` (9 kluczy, do weryfikacji)

Klucz = `driver-<płatność>-<kasowanie>`. Klucze są płaskie i zamknięte (agent nie składa tekstu z fragmentów), ale zgrupowane
pod kanałem `driver`: agent wybiera kanał, potem wariant.

- Płatność: `cash` (tylko gotówka), `card` (tylko karta), `cash-card` (gotówka i karta).
- Kasowanie: `unvalidated-ticket` (bilet do skasowania), `validated-ticket` (bilet już skasowany), `check-validation`
  (agent nie znalazł informacji u operatora, więc pasażer ma sprawdzić; wolno wybrać dopiero po przeszukaniu źródeł).

Przykłady kluczy: `driver-cash-unvalidated-ticket`, `driver-cash-card-validated-ticket`, `driver-card-check-validation`.

Krok 1 `[zakup]`, stały:
> Zaraz po wejściu do pojazdu podejdź do kierowcy i poproś o bilet.

Krok 2 `[zakup]`, zależy od płatności:

| Płatność | Tekst |
|---|---|
| `cash` | Zapłać kierowcy gotówką. Przygotuj odliczoną kwotę, bo kierowca zwykle nie wyda reszty. |
| `card` | Zapłać kierowcy kartą. Kierowca nie przyjmuje gotówki. |
| `cash-card` | Zapłać kierowcy gotówką lub kartą. Przy gotówce przygotuj odliczoną kwotę, bo kierowca zwykle nie wyda reszty. |

Krok 3 `[kasowanie]`, zależy od kasowania:

| Kasowanie | Tekst |
|---|---|
| `unvalidated-ticket` | Skasuj bilet w kasowniku w pojeździe. |
| `validated-ticket` | Bilet od kierowcy jest skasowany od razu po zakupie - nic więcej nie rób. |
| `check-validation` | Zapytaj kierowcę, czy bilet trzeba skasować. Jeśli tak, skasuj go w kasowniku w pojeździe. |

### `app-operator` (3 klucze, do weryfikacji)

Jak to działa: w aplikacji bilet jest zwykle kupowany i „skasowany” w momencie zakupu, ale żeby dokończyć proces, trzeba udowodnić,
że jesteś w pojeździe (kod QR, czasem inna czynność). Na to jest ograniczony czas.

Kroki 1 i 2 są wspólne dla wszystkich wariantów:

1. [zakup] Przed wejściem do pojazdu pobierz aplikację i zaloguj się lub załóż konto.
2. [zakup] Kup bilet, podążając za instrukcjami na ekranie.

| Klucz | Krok 3 `[kasowanie]` |
|---|---|
| `app-operator-active-on-purchase` | Bilet jest aktywny zaraz po zakupie. |
| `app-operator-scan-qr` | Niektóre bilety trzeba potwierdzić w pojeździe. Po zakupie masz ograniczony czas, aby zeskanować kod QR w pojeździe i udowodnić, że jesteś na pokładzie. Dodatkowe informacje znajdziesz w liście biletów poniżej. |
| `app-operator-confirm-in-vehicle` | Niektóre bilety trzeba potwierdzić w pojeździe inaczej niż kodem QR, np. wpisując numer taborowy. Po zakupie masz na to ograniczony czas. Dodatkowe informacje znajdziesz w liście biletów poniżej. |

Szczegóły (które bilety, jaki limit czasu, stop, rejestracja pakietu) to warstwa 2, na karcie biletu.

### `app-third-party` (1 klucz, do weryfikacji)

W aplikacjach zewnętrznych zwykle da się kupić tylko bilety jednorazowe, więc bez „niektóre bilety…” i bez odsyłacza do listy.

1. [zakup] Przed wejściem do pojazdu pobierz aplikację i zaloguj się lub załóż konto.
2. [zakup] Kup bilet, podążając za instrukcjami na ekranie.
3. [kasowanie] Zeskanuj kod QR i potwierdź zakup.

Klucz: `app-third-party-scan-qr`.

## Wymagania na słownik (z rozmowy, do zadania 2)

- Każdy kanał ma pola „używać, gdy" i „NIE używać, gdy", które agent musi sprawdzić przed wyborem. Sam klucz to za mało.
- Sposób płatności dotyczy obu sekcji strony („Jak kupić bilet…” i karty biletów), ale tylko tam, gdzie wynik jest niepewny.
  Automaty zwykle przyjmują kartę (czasem też gotówkę) i wydają resztę, więc nie dostają osi płatności. Kierowca jest
  zmienny: gotówka wymaga odliczonej kwoty. Istniejące `paymentInfo` w `operator.json` to ogólna lista, nie zastępuje tego.
- Karta miejska zakodowana w automacie to sprawa `city-card` lub warstwy 2, nie `machine-print-unvalidated-ticket`.

## Otwarte

- Biletomat w pojeździe, który drukuje bilet DO skasowania w kasowniku (Opole): osobny klucz? Zob. pytanie w rozmowie.
- Kolej i prom: dopiero gdy trafi się operator.
