import { useFormik } from 'formik'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { ArrowUp } from 'lucide-react'
export function ChatInputArea({
  disabled,
  onSend,
}: {
  disabled: boolean
  onSend: (text: string) => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  const form = useFormik({
    initialValues: { message: '' },
    validate: (v) =>
      !v.message.trim()
        ? { message: t('forms.required') }
        : v.message.length > 2000
          ? { message: t('journal.inputTooLong') }
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
        {t('journal.reflectionLabel')}
      </label>
      <div className="chat-compose">
        <textarea
          id="message"
          name="message"
          placeholder={t('journal.inputPlaceholder')}
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
          aria-label={t('journal.sendReflection')}
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <div className="input-footer">
        <span>
          {form.submitCount > 0 && form.errors.message
            ? form.errors.message
            : t('journal.honesty')}
        </span>
        <span>{t('journal.characters', { count: form.values.message.length })}</span>
      </div>
    </form>
  )
}