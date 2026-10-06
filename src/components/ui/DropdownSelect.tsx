import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import './ui.css'

type Option = {
  value: string
  label: string
  disabled: boolean
  group?: string
}
function optionText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? optionText(child.props.children)
        : String(child),
    )
    .join('')
}
function collectOptions(
  children: ReactNode,
  group?: string,
  disabled = false,
): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{
        children?: ReactNode
        value?: string | number
        label?: string
        disabled?: boolean
      }>(child)
    )
      return []
    if (child.type === Fragment)
      return collectOptions(child.props.children, group, disabled)
    if (child.type === 'optgroup')
      return collectOptions(
        child.props.children,
        child.props.label,
        disabled || !!child.props.disabled,
      )
    if (child.type !== 'option') return []
    const text = optionText(child.props.children)
    const label = child.props.label ?? text
    return [
      {
        value: String(child.props.value ?? text),
        label,
        group,
        disabled: disabled || !!child.props.disabled,
      },
    ]
  })
}

/** Radix controls the visible picker; a hidden form control preserves real change events and form values. */
export function DropdownSelect({
  children,
  value,
  defaultValue,
  onChange,
  className = '',
  id,
  disabled,
  name,
  required,
  icon,
  ...attributes
}: SelectHTMLAttributes<HTMLSelectElement> & { icon?: ReactNode }) {
  const options = collectOptions(children)
  const native = useRef<HTMLSelectElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [localValue, setLocalValue] = useState(
    String(defaultValue ?? options[0]?.value ?? ''),
  )
  const [implicitLabel, setImplicitLabel] = useState<string>()
  const [portalContainer, setPortalContainer] = useState<HTMLElement>()
  const selected = value === undefined ? localValue : String(value)
  // Encoding every value avoids reserved empty values and collisions with sentinel strings.
  const encode = (item: string) => `bloom:${item}`
  const ariaLabel = attributes['aria-label']
  const ariaLabelledBy = attributes['aria-labelledby']
  useLayoutEffect(() => {
    setPortalContainer(trigger.current?.closest('dialog') ?? undefined)
  }, [])
  const resetValue = String(defaultValue ?? options[0]?.value ?? '')
  useEffect(() => {
    if (value !== undefined) return
    const form = native.current?.form
    const reset = () => setLocalValue(resetValue)
    form?.addEventListener('reset', reset)
    return () => form?.removeEventListener('reset', reset)
  }, [value, resetValue])
  useLayoutEffect(() => {
    if (ariaLabel || ariaLabelledBy) return
    const label = trigger.current?.labels?.[0]
    if (!label) return
    const copy = label.cloneNode(true) as HTMLLabelElement
    copy
      .querySelectorAll('button, select')
      .forEach((control) => control.remove())
    setImplicitLabel(copy.textContent?.trim() || undefined)
  }, [ariaLabel, ariaLabelledBy, children])
  const changeValue = (encoded: string) => {
    const next = encoded.slice('bloom:'.length)
    if (!native.current) return
    native.current.value = next
    native.current.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const items = options.map((option) => (
    <RadixSelect.Item
      key={option.value}
      value={encode(option.value)}
      disabled={option.disabled}
      className="ui-menu-item"
      data-value={option.value}
    >
      <span className="ui-menu-check" aria-hidden="true">
        <RadixSelect.ItemIndicator>
          <Check size={15} />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
    </RadixSelect.Item>
  ))
  return (
    <>
      <RadixSelect.Root
        value={encode(selected)}
        onValueChange={changeValue}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          ref={trigger}
          id={id}
          className={`ui-select ${className}`}
          data-bloom-select=""
          data-value={selected}
          aria-label={attributes['aria-label'] ?? implicitLabel}
          aria-labelledby={attributes['aria-labelledby']}
          aria-describedby={attributes['aria-describedby']}
          aria-invalid={attributes['aria-invalid']}
          aria-required={required || undefined}
          title={attributes.title}
          tabIndex={attributes.tabIndex}
        >
          {icon}
          <RadixSelect.Value>
            <span className="ui-select-value">
              {options.find((option) => option.value === selected)?.label ??
                options[0]?.label}
            </span>
          </RadixSelect.Value>
          <RadixSelect.Icon className="ui-select-icon">
            <ChevronDown size={16} aria-hidden="true" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal container={portalContainer}>
          <RadixSelect.Content
            className="ui-menu ui-select-content"
            position="popper"
            sideOffset={6}
            collisionPadding={12}
          >
            <RadixSelect.Viewport>
              {options.some((option) => option.group)
                ? Array.from(
                    new Set(options.map((option) => option.group)),
                  ).map((group) => (
                    <RadixSelect.Group key={group ?? 'ungrouped'}>
                      {group && (
                        <RadixSelect.Label className="ui-menu-label">
                          {group}
                        </RadixSelect.Label>
                      )}
                      {items.filter(
                        (_, index) => options[index].group === group,
                      )}
                    </RadixSelect.Group>
                  ))
                : items}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      <select
        ref={native}
        hidden
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        name={name}
        required={required}
        disabled={disabled}
        value={selected}
        onChange={(event) => {
          setLocalValue(event.currentTarget.value)
          onChange?.(event)
        }}
      >
        {children}
      </select>
    </>
  )
}
