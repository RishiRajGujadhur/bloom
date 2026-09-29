export const FORM_STARTER = `<form>
  <h2>Join the garden</h2>
  <label>Your name</label>
  <input id="name" type="text">

  <label for="mail">Email address</label>
  <input id="email" type="email">

  <label for="visits">How often will you visit?</label>
  <select id="visits">
    <option>Once a week</option>
    <option>More often</option>
  </select>
</form>`

export type FormCheck = { label: string; pass: boolean; hint: string }

export function checkFormLabels(source: string): FormCheck[] {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  const form = doc.body.querySelector('form')
  const fields = Array.from(form?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select,textarea') ?? [])
  const labels = Array.from(form?.querySelectorAll<HTMLLabelElement>('label') ?? [])
  const ids = fields.map((field) => field.id)
  const fieldHasLabel = (field: HTMLInputElement | HTMLSelectElement) => labels.some((label) =>
    !!label.textContent?.trim() && (label.htmlFor === field.id && !!field.id || label.contains(field)))
  return [
    { label: 'Keep the three form fields', pass: !!form && fields.length === 3 && fields.some((field) => field.id === 'name') && fields.some((field) => field.id === 'email') && fields.some((field) => field.id === 'visits'), hint: 'Keep the name, email, and visits fields inside the form.' },
    { label: 'Give every field a unique ID', pass: fields.length === 3 && ids.every(Boolean) && new Set(ids).size === ids.length, hint: 'Each field needs its own non-empty id.' },
    { label: 'Name field has a connected label', pass: !!fields.find((field) => field.id === 'name' && fieldHasLabel(field)), hint: 'Add for="name" to the name label, or wrap the input in that label.' },
    { label: 'Email field has a connected label', pass: !!fields.find((field) => field.id === 'email' && fieldHasLabel(field)), hint: 'The email label’s for value must match the email input id.' },
    { label: 'Visit selector has a connected label', pass: !!fields.find((field) => field.id === 'visits' && fieldHasLabel(field)), hint: 'Connect the visits label to the select element.' },
  ]
}
