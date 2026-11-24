export type LlmRequest = {
  pages: { url: string; text: string }[]
  operator: { slug: string; name: string }
  jsonSchema: object
  instructions: string
  // What to do with the pages, one sentence for the user prompt
  task?: string
  // Name of the task (e.g. "check"); the fixture provider reads <slug>.<pass>.json for it
  pass?: string
}

// Provider-agnostic: returns raw JSON, validation happens in the checker
export interface LlmExtractor {
  name: string
  extract(args: LlmRequest): Promise<unknown>
}
