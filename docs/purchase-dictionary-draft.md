# Słownik sposobów zakupu i kasowania biletów (ROBOCZY)

Status: iteracja 1, zadanie 1 (inwentaryzacja). Plik roboczy, nie źródło prawdy. Po zatwierdzeniu trafi do `data/` jako
słownik ze schematem Zod (zadanie 2).

Oznaczenia kroków: `[zakup]`, `[kasowanie]`. Kroku `[kontrola]` nie ma: kontrola biletów jest poza zakresem.

## A. Kanały sprzedaży

| # | Klucz roboczy | Opis | Kroki |
|---|---|---|---|
| 1 | `machine-stop` | Automat biletowy stacjonarny (przystanek, stacja, węzeł) | do podania |
| 2 | `machine-vehicle` | Biletomat w pojeździe (to NIE jest zakup u kierowcy) | do podania |
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

## Otwarte

- Kolej i prom: dopiero gdy trafi się operator.
- Czy kroki `[kasowanie]` należą do kanału, czy do pary kanał × forma biletu (np. aplikacja: QR vs aktywacja)? Do decyzji w zadaniu 2.
