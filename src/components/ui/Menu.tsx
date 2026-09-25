import * as Dropdown from '@radix-ui/react-dropdown-menu'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import './ui.css'

/**
 * Accessible menus and selects built on Radix primitives: keyboard support,
 * focus management, typeahead and collision-aware positioning come for free,
 * while the look stays Bloom's.
 */
export type MenuItem =
  | {
      kind?: 'item'
      label: string
      icon?: ReactNode
      hint?: string
      onSelect: () => void
    }
  | {
      kind: 'checkbox'
      label: string
      icon?: ReactNode
      checked: boolean
      onCheckedChange: (checked: boolean) => void
    }
  | { kind: 'separator' }
  | { kind: 'label'; label: string }

export function Menu({
  trigger,
  items,
  align = 'end',
  label,
}: {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'start' | 'center' | 'end'
  /** Accessible name for the menu content. */
  label?: string
}) {
  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className="ui-menu"
          align={align}
          sideOffset={8}
          collisionPadding={12}
          aria-label={label}
        >
          {items.map((item, i) =>
            item.kind === 'separator' ? (
              <Dropdown.Separator key={i} className="ui-menu-separator" />
            ) : item.kind === 'label' ? (
              <Dropdown.Label key={i} className="ui-menu-label">
                {item.label}
              </Dropdown.Label>
            ) : item.kind === 'checkbox' ? (
              <Dropdown.CheckboxItem
                key={item.label}
                className="ui-menu-item"
                checked={item.checked}
                onCheckedChange={item.onCheckedChange}
                // Keep the menu open so several modules can be toggled at once.
                onSelect={(event) => event.preventDefault()}
              >
                <span className="ui-menu-check" aria-hidden="true">
                  <Dropdown.ItemIndicator>
                    <Check size={15} />
                  </Dropdown.ItemIndicator>
                </span>
                {item.icon}
                <span>{item.label}</span>
              </Dropdown.CheckboxItem>
            ) : (
              <Dropdown.Item
                key={item.label}
                className="ui-menu-item"
                onSelect={item.onSelect}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.hint && <kbd className="ui-menu-hint">{item.hint}</kbd>}
              </Dropdown.Item>
            ),
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  )
}

export function Select({
  value,
  onValueChange,
  options,
  label,
  className = '',
  disabled,
  icon,
}: {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  /** Accessible name; the select has no visible label of its own. */
  label: string
  className?: string
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <RadixSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        className={`ui-select ${className}`}
        aria-label={label}
      >
        {icon}
        <RadixSelect.Value />
        <RadixSelect.Icon className="ui-select-icon">
          <ChevronDown size={16} aria-hidden="true" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="ui-menu ui-select-content"
          position="popper"
          sideOffset={8}
          collisionPadding={12}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="ui-menu-item"
              >
                <span className="ui-menu-check" aria-hidden="true">
                  <RadixSelect.ItemIndicator>
                    <Check size={15} />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
