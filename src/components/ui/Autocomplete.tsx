import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { useLayoutEffect, useRef, useState } from 'react'
import './ui.css'

/** Library-backed suggestions that still accept free text and normal form submission. */
export function Autocomplete({
  value,
  onValueChange,
  options,
  label,
  placeholder,
}: {
  value: string
  onValueChange: (value: string) => void
  options: readonly string[]
  label: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useState<HTMLElement>()
  useLayoutEffect(
    () => setContainer(input.current?.closest('dialog') ?? undefined),
    [],
  )
  useLayoutEffect(() => {
    // cmdk assumes an always-visible list; reflect this popover's actual state.
    const field = input.current
    field?.setAttribute('aria-expanded', String(open))
    if (open && list.current)
      field?.setAttribute('aria-controls', list.current.id)
    else {
      field?.removeAttribute('aria-controls')
      field?.removeAttribute('aria-activedescendant')
    }
  }, [open])
  return (
    <Command label={label} loop className="ui-autocomplete">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <Command.Input
            ref={input}
            value={value}
            aria-label={label}
            placeholder={placeholder}
            aria-expanded={open}
            onFocus={() => setOpen(true)}
            onValueChange={(next) => {
              onValueChange(next)
              setOpen(true)
            }}
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape' && open) {
                event.preventDefault()
                event.stopPropagation()
                setOpen(false)
              } else if (
                event.key === 'Enter' &&
                (!open ||
                  !list.current?.querySelector(
                    '[cmdk-item][aria-selected="true"]',
                  ))
              ) {
                // Keep the form's usual Enter action when suggestions are closed.
                event.stopPropagation()
              } else if (event.key === 'ArrowDown' && !open) {
                event.preventDefault()
                event.stopPropagation()
                setOpen(true)
              }
            }}
          />
        </Popover.Anchor>
        <Popover.Portal container={container}>
          <Popover.Content
            className="ui-menu ui-autocomplete-menu"
            role="presentation"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (
                event.target === input.current ||
                event.detail.originalEvent.target === input.current
              )
                event.preventDefault()
            }}
          >
            <Command.List ref={list} aria-label={`${label} suggestions`}>
              <Command.Empty className="ui-autocomplete-empty">
                No saved matches. You can enter your own.
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option}
                  value={option}
                  className="ui-menu-item"
                  onSelect={() => {
                    onValueChange(option)
                    input.current?.focus()
                    setOpen(false)
                  }}
                >
                  {option}
                </Command.Item>
              ))}
            </Command.List>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </Command>
  )
}
