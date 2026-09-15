import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, ArrowRight } from 'lucide-react'
import { advance, newSession, reply, stepChips } from '../../model'
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
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
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
            ? { ...d, draft: advance(d.draft, language) }
            : d,
        ),
      800,
    )
    return () => clearTimeout(timer)
  }, [session?.flow.typing, session?.metadata.id, setData, language])
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
    <section className="card journal" id="journal">
      <div className="card-heading">
        <div className="section-title">
          <span className="icon-tile purple">
            <BookOpen size={19} />
          </span>
          <div>
            <h2>{t('journal.title')}</h2>
            <p>{t('journal.subtitle')}</p>
          </div>
        </div>
        <span className="badge">
          {session
            ? t('journal.stepCounter', {
                step: session.flow.complete ? 4 : session.flow.step + 1,
              })
            : t('journal.fiveMin')}
        </span>
      </div>
      {!session ? (
        <div className="journal-welcome">
          <div className="journal-illustration" aria-hidden="true">
            ✦<span>☾</span>✧
          </div>
          <h3>{t('journal.welcome')}</h3>
          <p>
            {t('journal.welcomeMessage1')}
            <br />
            {t('journal.welcomeMessage2')}
          </p>
          <button
            className="primary"
            onClick={() => {
              setData((d) => ({ ...d, draft: newSession(language) }))
              setTags('')
            }}
          >
            {t('journal.button')} <ArrowRight size={17} />
          </button>
          <small>{t('journal.guides')}</small>
        </div>
      ) : (
        <>
          <JournalHeader session={session} onRate={rate} />
          <MessageFeed session={session} />
          {!session.flow.complete ? (
            <>
              <PromptChips
                chips={stepChips(session.flow.step, language)}
                disabled={session.flow.typing}
                onChoose={send}
              />
              <ChatInputArea disabled={session.flow.typing} onSend={send} />
            </>
          ) : (
            <div className="journal-finish">
              <p>
                <strong>{t('journal.youShowedUp')}</strong> {t('journal.thatMatters')}
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
                {saved ? t('journal.view') : t('journal.save')}{' '}
                <ArrowRight size={16} />
              </button>
              {saved && (
                <button
                  className="text-button"
                  onClick={() => {
                    setData((d) => ({ ...d, draft: newSession(language) }))
                    setTags('')
                  }}
                >
                  {t('journal.another')}
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