import { z } from 'zod'

// What the small model decides: only whether a stored fact is still on the page. Verdicts are re-checked in code
export const judgeSchema = z.strictObject({
  results: z.array(
    z.strictObject({
      id: z.number().int(),
      verdict: z.enum(['confirmed', 'changed', 'not_found']),
      // Copied word for word from the page: the text that shows the fact (confirmed) or its new form (changed)
      quote: z.string().nullish(),
    }),
  ),
})

export type Judgement = z.infer<typeof judgeSchema>['results'][number]

export const judgeInstructions =
  () => `You check whether facts about a public transport operator are still correct on the operator's web page.

You get the page text and a numbered list of claims. Each claim names a value in our data (path = value) and the quote that backed it earlier.
For every claim return one result with the same "id":
- "confirmed": the page still states this value. "quote" is the text of the page that shows it, copied word for word (a table row such as "Bilet 20-minutowy | 3,40 | 1,70" or one sentence).
- "changed": the page states the same thing (same ticket, method or rule) with a different value. "quote" is the page text with the new value, copied word for word.
- "not_found": the page no longer mentions it.
Never guess and never copy a quote from the claim list: a quote must come from the page text. Answer for every claim.`
