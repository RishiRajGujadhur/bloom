import { useFormik } from 'formik'
import { ArrowUp } from 'lucide-react'
export function ChatInputArea({
  disabled,
  onSend,
}: {
  disabled: boolean
  onSend: (text: string) => void
}) {
  const form = useFormik({
    initialValues: { message: '' },
    validate: (v) =>
      !v.message.trim()
        ? { message: 'Write a reflection first.' }
        : v.message.length > 2000
          ? { message: 'Keep your reply under 2,000 characters.' }
          : {},
    onSubmit: (values, helpers) => {
      if (disabled) return
      onSend(values.message)
      helpers.resetForm()
    },
  })
  return (
    <form className="chat-form" onSubmit={form.handleSubmit}>
      <label className="sr-only" htmlFor="message">
        Your reflection
      </label>
      <div className="chat-compose">
        <textarea
          id="message"
          name="message"
          placeholder="There’s no right answer. Start wherever you are…"
          rows={2}
          maxLength={2000}
          value={form.values.message}
          onChange={(e) => {
            form.handleChange(e)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`
          }}
          disabled={disabled}
        />
        <button
          className="send"
          type="submit"
          disabled={disabled || !form.values.message.trim()}
          aria-label="Send reflection"
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <div className="input-footer">
        <span>
          {form.submitCount > 0 && form.errors.message
            ? form.errors.message
            : 'A little honesty goes a long way.'}
        </span>
        <span>{form.values.message.length}/2000</span>
      </div>
    </form>
  )
}
