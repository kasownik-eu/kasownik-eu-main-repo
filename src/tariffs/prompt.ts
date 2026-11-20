export const tariffInstructions = (transportModes: readonly string[]) => `You extract public transport tariff data for one operator from the text of the operator's web pages.
Return JSON that matches the provided JSON schema exactly.

Rules:
- Use only facts stated in the text. Never guess; omit a field whose value is not given (or use JSON null); never write the string "null" or an empty string.
- Go through the price tables one by one and output one entry per table row of tickets and ticket packages; do not skip such rows or whole tables (also not later tables that look like earlier ones). Leave out event or group offers, fees, penalties and fees for luggage, bikes or animals completely (those are handled elsewhere).
- kind: "ticket" for a ticket a passenger buys to travel (single trip, time, day and period tickets, passes, bearer and annual tickets), "package" for a bundle of several rides (e.g. "Pakiet 20"), "luggage" for luggage or animal fees, "event_offer", "fee" and "other" only for the rare row that cannot be left out; code removes them.
- duration: how long the ticket is valid as { "value", "unit" } with unit minutes, hours, days, months or years: "20 minut" -> 20 minutes, "24 godziny" -> 24 hours, until the end of the day -> 1 day, "30 dni" -> 30 days. A fare whose row only names a time bracket also has a duration, its upper limit: "do 5 minut" -> 5 minutes, "powyżej 5 do 10 minut" -> 10 minutes. Omit it when no validity is stated. Do not decide the ticket category, it is derived from kind and duration.
- The same ticket name can appear in several tables with different validity or price (e.g. paper vs. electronic/promotional, or from validation vs. from purchase). Output each as its own ticket and make the names unique by adding the difference in brackets, e.g. "Grupowy (bilet elektroniczny)". Add such a bracket only when the name would otherwise repeat; never label a ticket "paper" or "electronic" unless its table heading says so (a heading with both, e.g. "papierowych i elektronicznych", needs no bracket).
- Every text field is an object with only "pl", the Polish text as in the source. Do not translate.
- Keep texts short: names and short phrases of at most about 12 words, never whole sentences copied from the source, except rulesNote and zones.note (max. 2 sentences).
- transportModes: the operator runs only ${transportModes.map((m) => `"${m}"`).join(', ')}. Use only these values; list the modes a ticket or luggage item is valid on, or null when the text does not say.
- scope: only a real restriction of where the ticket is valid (a city, zone or line); omit it for tickets valid on the whole network.
- Zones: set enabled to false and leave items empty when the operator has a single fare zone.
- Ignore where tickets are sold and how to buy or validate them; that is handled elsewhere (there is no field for it).`

// Second pass of the sync: rules for carrying luggage, bikes, pets and strollers (pages from luggageSources)
export const luggageInstructions = (transportModes: readonly string[]) => `You extract the rules for carrying luggage, bikes, animals and strollers in public transport for one operator from the text of the operator's web pages.
Return JSON that matches the provided JSON schema exactly.

Rules:
- Use only facts stated in the text. Never guess; omit a field whose value is not given (or use JSON null); never write the string "null" or an empty string.
- One entry per type of thing carried, not one per sentence; merge similar things with the same rules into one entry (e.g. electric scooters and similar personal transport devices). type: "luggage" for hand luggage and bags, "bike" for bicycles (and scooters or similar devices the text treats like bicycles), "pet" for dogs and other animals, "stroller" for baby strollers and prams, "other" for anything else that is allowed (e.g. wheelchairs and mobility aids, skis, musical instruments not covered by luggage).
- item: a short Polish name, e.g. "Bagaż podręczny", "Rower", "Pies", "Wózek dziecięcy". note: size or number limits in a few words, e.g. "do 3 sztuk".
- A rule that applies to everything carried (e.g. "not on seats") goes only into the "luggage" entry, never into entries it does not concern (strollers and wheelchairs have priority seats). Write only rules that are in the text, and take each entry's conditions only from the sentences that name that very type (a duty of the bike carrier is not a rule of strollers); do not add details such as straps or holders.
- Merge all scooters, skateboards, roller skates and similar devices into one "other" entry, and give wheelchairs and mobility aids their own "other" entry whenever the text mentions them.
- note: leave it out when there is no limit to state; never write "-".
- fee: a number only when the text states a price for carrying it. When the text says carrying it is free of charge, leave fee out. Do not write "0".
- feeText: only a short phrase when the fee is not a plain price (e.g. "bezpłatnie poza godzinami szczytu"); otherwise leave it out.
- conditions: the main rules in at most 2 short sentences (where in the vehicle, leash/muzzle, who has priority, what must be secured). Mention a prohibition here only when it is about exactly that type (e.g. shared city bikes under "bike"); never copy a list of prohibitions onto entries it does not concern, and do not output prohibited items as entries of their own.
- Leave out rules that are not about carrying things (tickets, controls, complaints, liability, vehicle behaviour) and general rules about passengers.
- transportModes: the operator runs only ${transportModes.map((m) => `"${m}"`).join(', ')}. Use only these values; list the modes the rule applies to, or leave it out when the text does not say.
- Every text field is an object with only "pl", the Polish text as in the source. Do not translate. Keep texts short, never whole paragraphs copied from the source.`
