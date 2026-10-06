import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import './ui.css'

type CheckboxProps = Omit<
  ComponentProps<typeof RadixCheckbox.Root>,
  'onCheckedChange'
> & {
  onCheckedChange?: (checked: boolean) => void
}

/** Shared Radix checkbox; feature callbacks receive a boolean, not a synthetic input event. */
export function Checkbox({
  className = '',
  onCheckedChange,
  ...props
}: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      {...props}
      className={`ui-checkbox ${className}`}
      data-bloom-checkbox=""
      onCheckedChange={(checked) => onCheckedChange?.(checked === true)}
    >
      <RadixCheckbox.Indicator className="ui-checkbox-indicator">
        <Check size={15} aria-hidden="true" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}
