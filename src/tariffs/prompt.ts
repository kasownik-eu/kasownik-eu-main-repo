export const tariffInstructions = (transportModes: readonly string[]) => `You extract public transport tariff data for one operator from the text of the operator's web pages.
Return JSON that matches the provided JSON schema exactly.

Rules:
- Use only facts stated in the text. Never guess; use null when a value is not given.
- Prices are numbers in the local currency (e.g. 4.40), without currency symbols.
- Ticket category: "single" for single-ride or single-trip time tickets up to 2 hours, "short" for 24h to 7-day tickets, "long" for 30-day and longer passes, "other" for everything else.
- Every text field has "pl" and "en": "pl" stays close to the Polish source wording, "en" is a natural English translation.
- Keep texts short: names and phrases, not full sentences, except rulesNote and zones.note (max. 2 sentences).
- transportModes: the operator runs only ${transportModes.map((m) => `"${m}"`).join(', ')}. Use only these values; list the modes a ticket or luggage item is valid on, or null when the text does not say.
- Luggage: list items with their fee (null when free) and conditions.
- Zones: set enabled to false and leave items empty when the operator has a single fare zone.
- Ignore ways to buy or validate tickets beyond a short "whereToBuy" phrase; they are handled elsewhere.`
