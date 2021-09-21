let loadedLangString: string
let loadedLang: any
export default async function getLang(langString: string) {
  if (loadedLangString != langString || loadedLang == null) {
    const langData = await import(`./${langString}.json`)
    loadedLang = langData
    loadedLangString = langString
  }
  return loadedLang
}
