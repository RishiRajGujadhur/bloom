export const HTML_STARTER = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>My first page</title>
  </head>
  <body>
    <!-- Build your page here -->
  </body>
</html>`

export type HtmlCheck = { id: string; label: string; pass: boolean; hint: string }

export function checkHtmlDocument(source: string): HtmlCheck[] {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const body = doc.body
  const header = body.querySelector(':scope > header')
  const main = body.querySelector(':scope > main')
  const footer = body.querySelector(':scope > footer')
  const h1 = main?.querySelector('h1')
  const label = main?.querySelector<HTMLLabelElement>('label[for]')
  const input = label ? Array.from(main?.querySelectorAll('input[id]') ?? []).find((field) => field.id === label.htmlFor) : null
  return [
    { id: 'document', label: 'Document type and language', pass: doc.doctype?.name.toLowerCase() === 'html' && !!doc.documentElement.lang.trim(), hint: 'Start with <!doctype html> and give <html> a lang attribute.' },
    { id: 'title', label: 'Page title', pass: !!doc.querySelector('head > title')?.textContent?.trim(), hint: 'Add a meaningful <title> inside <head>.' },
    { id: 'regions', label: 'Header, main, and footer', pass: !!header && !!main && !!footer, hint: 'Put <header>, <main>, and <footer> directly inside <body>.' },
    { id: 'heading', label: 'Main heading', pass: !!h1?.textContent?.trim(), hint: 'Add a non-empty <h1> inside <main>.' },
    { id: 'label', label: 'Connected form label', pass: !!label?.textContent?.trim() && !!input, hint: 'Place a <label for="name"> and <input id="name"> inside <main>.' },
  ]
}

export function previewHtml(source: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">`
  return /<head\b[^>]*>/i.test(source) ? source.replace(/<head\b[^>]*>/i, (head) => `${head}${policy}`) : `${policy}${source}`
}
