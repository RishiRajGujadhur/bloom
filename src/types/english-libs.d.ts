declare module 'write-good' {
  type Suggestion = { index: number; offset: number; reason: string }
  const writeGood: (text: string, opts?: Record<string, boolean>) => Suggestion[]
  export default writeGood
}
declare module 'wink-lemmatizer' {
  const lemmatizer: { noun(w: string): string; verb(w: string): string; adjective(w: string): string }
  export default lemmatizer
}
declare module 'an-array-of-english-words' {
  const words: string[]
  export default words
}
declare module 'stopword' {
  export function removeStopwords(words: string[], list?: string[]): string[]
  export const eng: string[]
}
