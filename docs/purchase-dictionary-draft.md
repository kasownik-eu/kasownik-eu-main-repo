# Słownik sposobów zakupu i kasowania biletów (ROBOCZY)

Status: iteracja 1, zadanie 1 (inwentaryzacja). Plik roboczy, nie źródło prawdy. Po zatwierdzeniu trafi do `data/` jako
słownik ze schematem Zod (zadanie 2).

Oznaczenia kroków: `[zakup]`, `[kasowanie]`. Kroku `[kontrola]` nie ma: kontrola biletów jest poza zakresem.

## A. Kanały sprzedaży

| # | Klucz roboczy | Opis | Kroki |
|---|---|---|---|
| 1 | `machine-stop` | Automat biletowy stacjonarny (przystanek, stacja, węzeł) | zatwierdzone, patrz E |
| 2 | `machine-vehicle-print-validated-ticket` | Biletomat w pojeździe, który drukuje papierowy bilet już skasowany. NIE dotyczy: zakupu u kierowcy, płatności kartą w pojeździe (to `contactless` / `vehicle-terminal`), biletu do skasowania w kasowniku | zatwierdzone, patrz E |
| 3 | `office` | Kasa, POK, punkt obsługi pasażera | do podania |
| 4 | `partner-shop` | Kiosk, sklep, punkt partnerski (POS) | do podania |
| 5 | `driver` | Kierowca / konduktor | do podania |
| 6 | `app-operator` | Aplikacja operatora (może mieć pakiety i bilety niedostępne gdzie indziej, np. Transport GZM) | do podania |
| 7 | `app-third-party` | Aplikacja zewnętrzna (SkyCash, moBiLET, zBiletem, jakdojade) | do podania |
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

### `machine-stop`

1. [zakup] Kup bilet w automacie biletowym.
2. [kasowanie] Po wejściu do pojazdu skasuj bilet i zachowaj do końca podróży.

### `machine-vehicle-print-validated-ticket`

Używać TYLKO, gdy biletomat w pojeździe drukuje papierowy bilet automatycznie skasowany. Operator bez automatów poza
pojazdem nie dostaje `machine-stop`.

1. [zakup] Poszukaj automatu wewnątrz pojazdu.
2. [zakup] Kup bilet w automacie biletowym.
3. [kasowanie] Bilet z biletomatu jest skasowany od razu po zakupie - nic więcej nie rób.

## Wymagania na słownik (z rozmowy, do zadania 2)

- Każdy kanał ma pola „używać, gdy" i „NIE używać, gdy", które agent musi sprawdzić przed wyborem. Sam klucz to za mało.
- Karta miejska zakodowana w automacie to sprawa `city-card` lub warstwy 2, nie `machine-stop`.

## Otwarte

- Biletomat w pojeździe, który drukuje bilet DO skasowania w kasowniku (Opole): osobny klucz? Zob. pytanie w rozmowie.
- Kolej i prom: dopiero gdy trafi się operator.
