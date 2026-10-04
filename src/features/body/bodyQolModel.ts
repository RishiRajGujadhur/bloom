/** Numeric form fields retain the prior value while an input is empty/invalid. */
export function exactNumber(value: string, min: number, max: number, integer = false) {
  if (!value.trim()) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) return null
  return integer ? Math.round(number) : number
}

export function progressPhotoError(file: { type: string; size: number }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) return 'Choose a JPG, PNG, WebP, GIF or AVIF photo.'
  if (!file.size || file.size > 10 * 1024 * 1024) return 'Choose a photo smaller than 10 MB.'
  return ''
}
