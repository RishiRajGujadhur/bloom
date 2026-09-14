export function PromptChips({
  chips,
  disabled,
  onChoose,
}: {
  chips: readonly string[]
  disabled: boolean
  onChoose: (text: string) => void
}) {
  return (
    <div className="chips" aria-label="Suggested replies">
      {chips.map((chip) => (
        <button disabled={disabled} key={chip} onClick={() => onChoose(chip)}>
          {chip}
        </button>
      ))}
    </div>
  )
}
