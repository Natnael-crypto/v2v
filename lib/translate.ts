export async function translateText(
    text: string,
    targetLang: string
): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Translation failed: ${res.statusText}`);
    }

    const data = await res.json();

    // Google Translate returns a nested array: [[["translated text", "original text", ...]]]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item: [string, ...unknown[]]) => item[0]).join('');
    }

    throw new Error("Invalid response from translation service");
}
