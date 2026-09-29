import { checkHtmlDocument, HTML_STARTER, previewHtml } from '../src/features/code/htmlBuilderModel'

test('checks meaningful HTML regions and a connected form label', () => {
  expect(checkHtmlDocument(HTML_STARTER).filter((item) => item.pass).map((item) => item.id)).toEqual(['document', 'title'])
  const complete = HTML_STARTER.replace('<!-- Build your page here -->', '<header>Profile</header><main><h1>Ada</h1><label for="name">Name</label><input id="name"></main><footer>Thanks</footer>')
  expect(checkHtmlDocument(complete).every((item) => item.pass)).toBe(true)
  expect(checkHtmlDocument(complete.replace('id="name"', 'id="other"')).find((item) => item.id === 'label')?.pass).toBe(false)
})

test('preview includes a policy that blocks scripts and external resources', () => {
  const preview = previewHtml(HTML_STARTER)
  expect(preview).toContain("default-src 'none'")
  expect(preview).toContain('<title>My first page</title>')
})
