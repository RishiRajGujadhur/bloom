import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { Dispatch, SetStateAction } from 'react'
import { BookOpen, ArrowRight } from 'lucide-react'
import { advance, newSession, reply, steps } from '../../model'
import type { AppData } from '../../model'
import { JournalHeader } from './JournalHeader'
import { MessageFeed } from './MessageFeed'
import { PromptChips } from './PromptChips'
import { ChatInputArea } from './ChatInputArea'
import { SessionSummaryModal } from './SessionSummaryModal'

export function ChatJournalContainer({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const session = data.draft
  const [summary, setSummary] = useState(false)
  const [tags, setTags] = useState('')
  useEffect(() => {
    if (!session?.flow.typing) return
    const sessionId = session.metadata.id
    const timer = setTimeout(
      () =>
        setData((d) =>
          d.draft?.metadata.id === sessionId
            ? { ...d, draft: advance(d.draft) }
            : d,
        ),
      800,
    )
    return () => clearTimeout(timer)
  }, [session?.flow.typing, session?.metadata.id, setData])
  const send = (text: string) =>
    setData((d) => (d.draft ? { ...d, draft: reply(d.draft, text) } : d))
  const saved = Boolean(
    session && data.sessions.some((s) => s.metadata.id === session.metadata.id),
  )
  const rate = (field: 'mood' | 'energy', value: number) =>
    setData((d) => {
      if (!d.draft) return d
      const updated = {
        ...d.draft,
        metadata: { ...d.draft.metadata, [field]: value },
      }
      return {
        ...d,
        draft: updated,
        sessions: d.sessions.map((s) =>
          s.metadata.id === updated.metadata.id ? updated : s,
        ),
      }
    })
  const save = () => {
    if (!session?.flow.complete) return
    setData((d) => {
      if (!d.draft) return d
      const finished = {
        ...d.draft,
        metadata: {
          ...d.draft.metadata,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 8),
        },
      }
      return {
        ...d,
        draft: finished,
        sessions: [
          ...d.sessions.filter((s) => s.metadata.id !== finished.metadata.id),
          finished,
        ],
      }
    })
    setSummary(true)
  }
  return (
    <section className="card journal" id="chat-journal">
      <div className="card-heading">
        <div className="section-title">
          <span className="icon-tile purple">
            <BookOpen size={19} />
          </span>
          <div>
            <h2>{t('journal.reflectionSpace')}</h2>
            <p>{t('journal.clarity')}</p>
          </div>
        </div>
        <span className="badge">
          {session
            ? `${session.flow.complete ? 4 : session.flow.step + 1} / 4`
            : '5 MIN FOR YOU'}
        </span>
      </div>
      {!session ? (
        <div className="journal-welcome">
          <div className="journal-illustration" aria-hidden="true">
            ✦<span>☾</span>✧
          </div>
          <h3>{t('journal.makeRoom')}</h3>
          <p>
            Notice how you feel, celebrate a small win,
            <br />
            and find your next gentle step.
          </p>
          <button
            className="primary"
            onClick={() => {
              setData((d) => ({ ...d, draft: newSession() }))
              setTags('')
            }}
          >
            {t('journal.checkIn')} <ArrowRight size={17} />
          </button>
          <small>{t('journal.guidedPrivate')}</small>
        </div>
      ) : (
        <>
          <JournalHeader session={session} onRate={rate} />
          <MessageFeed session={session} />
          {!session.flow.complete ? (
            <>
              <PromptChips
                chips={steps[session.flow.step].chips}
                disabled={session.flow.typing}
                onChoose={send}
              />
              <ChatInputArea disabled={session.flow.typing} onSend={send} />
            </>
          ) : (
            <div className="journal-finish">
              <p>
                <strong>{t('journal.showedUp')}</strong>
              </p>
              {!saved && (
                <label>
                  {t('journal.tags')}
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    maxLength={160}
                    placeholder={t('journal.tagsPlaceholder')}
                  />
                </label>
              )}
              <button
                className="primary"
                onClick={saved ? () => setSummary(true) : save}
              >
                {saved ? t('journal.viewSaved') : t('journal.saveReview')}{' '}
                <ArrowRight size={16} />
              </button>
              {saved && (
                <button
                  className="text-button"
                  onClick={() => {
                    setData((d) => ({ ...d, draft: newSession() }))
                    setTags('')
                  }}
                >
                  {t('journal.anotherCheckIn')}
                </button>
              )}
            </div>
          )}
        </>
      )}
      {summary && session && (
        <SessionSummaryModal
          session={session}
          onClose={() => setSummary(false)}
        />
      )}
    </section>
  )
}
