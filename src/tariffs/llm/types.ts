export type TariffExtractArgs = {
  pages: { url: string; text: string }[]
  operator: { slug: string; name: string }
  jsonSchema: object
  instructions: string
}

// Provider-agnostic: returns raw JSON, validation happens in the sync pipeline
export interface TariffExtractor {
  name: string
  extract(args: TariffExtractArgs): Promise<unknown>
}
