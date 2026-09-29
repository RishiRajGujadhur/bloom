export type BoxSettings = { width: number; height: number; padding: number; border: number; margin: number; sizing: 'content-box' | 'border-box' }

export const BOX_START: BoxSettings = { width: 180, height: 80, padding: 8, border: 4, margin: 8, sizing: 'content-box' }
export const BOX_TARGET = { contentWidth: 180, contentHeight: 80, borderWidth: 240, borderHeight: 140, outerWidth: 280, outerHeight: 180 }

export function measureBox(settings: BoxSettings) {
  const frame = 2 * (settings.padding + settings.border)
  const contentWidth = Math.max(0, settings.sizing === 'border-box' ? settings.width - frame : settings.width)
  const contentHeight = Math.max(0, settings.sizing === 'border-box' ? settings.height - frame : settings.height)
  const borderWidth = settings.sizing === 'border-box' ? settings.width : settings.width + frame
  const borderHeight = settings.sizing === 'border-box' ? settings.height : settings.height + frame
  return { contentWidth, contentHeight, borderWidth, borderHeight, outerWidth: borderWidth + 2 * settings.margin, outerHeight: borderHeight + 2 * settings.margin }
}

export function checkBoxModel(settings: BoxSettings) {
  const size = measureBox(settings)
  return [
    { label: 'Content area is 180 × 80 px', pass: size.contentWidth === BOX_TARGET.contentWidth && size.contentHeight === BOX_TARGET.contentHeight, hint: 'Choose the content size first. In border-box mode, width and height include padding and border.' },
    { label: 'Border box is 240 × 140 px', pass: size.borderWidth === BOX_TARGET.borderWidth && size.borderHeight === BOX_TARGET.borderHeight, hint: 'Padding and border expand the frame around content in content-box mode.' },
    { label: 'Total footprint is 280 × 180 px', pass: size.outerWidth === BOX_TARGET.outerWidth && size.outerHeight === BOX_TARGET.outerHeight, hint: 'Margin sits outside the border on both sides.' },
  ]
}
