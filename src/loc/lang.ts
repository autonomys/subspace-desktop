let loadedLangString: string
let loadedLang: LangType
export type LangType = { [index: string]: { [index: string]: string } }
export async function getLang(langString: string):Promise<LangType> {
  if (loadedLangString != langString || loadedLang == null) {
    const langData = await import(`./${langString}.json`) as LangType
    loadedLang = langData
    loadedLangString = langString
  }
  return loadedLang
}
