import { subOn } from '../../features/subFeatures'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { Dispatch, SetStateAction } from 'react'
import { BookOpen, ArrowRight, Clock3, Sparkles } from 'lucide-react'
import { advance, newSession, reply, stepChips } from '../../model'
import type { AppData, Session } from '../../model'
import { JournalHeader } from './JournalHeader'
import { MessageFeed } from './MessageFeed'
import { PromptChips } from './PromptChips'
import { ChatInputArea } from './ChatInputArea'
import { SessionSummaryModal } from './SessionSummaryModal'
import { MicroJournalComposer } from './MicroJournalComposer'
import { JournalQuick } from '../../features/quick/JournalQuick'
import { StoryCarousel } from '../../features/showcase/StoryCarousel'

export function ChatJournalContainer({
  data,
  setData,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const { t } = useTranslation(undefined, { i18n })
  const language = i18n.resolvedLanguage ?? 'en'
  const session = data.draft
  const [summary, setSummary] = useState<Session | null>(null)
  const [tags, setTags] = useState('')
  const [mode, setMode] = useState<'quick' | 'guided'>(() =>
    session ? 'guided' : 'quick',
  )
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
    const finished: Session = {
      ...session,
      metadata: {
        ...session.metadata,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8),
      },
    }
    setData((d) => {
      if (!d.draft) return d
      return {
        ...d,
        draft: finished,
        sessions: [
          ...d.sessions.filter((s) => s.metadata.id !== finished.metadata.id),
          finished,
        ],
      }
    })
    setSummary(session)
  }
  const microEntries = [...data.sessions]
    .filter((entry) => entry.metadata.entryType === 'micro')
    .sort((a, b) => Date.parse(b.metadata.date) - Date.parse(a.metadata.date))
    .slice(0, 3)
  return (
    <section
      className="card journal mx-auto w-full max-w-5xl rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-6"
      id="chat-journal"
    >
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
          {mode === 'quick'
            ? t('journal.quickEntry')
            : session
              ? t('ui.stepCounter', {
                  step: session.flow.complete ? 4 : session.flow.step + 1,
                })
              : t('ui.fiveMin')}
        </span>
      </div>
      <StoryCarousel sessions={data.sessions} onOpen={setSummary} />
      {mode === 'guided' && (
        <JournalQuick
          lastReply={[...(session?.messages ?? [])].reverse().find((m) => m.sender === 'user')?.text ?? ''}
          onMood={(score) => {
            if (!session) setData((d) => (d.draft ? d : { ...d, draft: newSession(language) }))
            rate('mood', score)
          }}
          onTopics={(topics) => setTags(topics.join(', '))}
        />
      )}
      <div className="journal-mode-switch" aria-label="Journal style">
        {subOn('chatJournal', 'quickEntry') && (
          <button
            aria-pressed={mode === 'quick'}
            onClick={() => setMode('quick')}
          >
            <Sparkles size={15} /> {t('journal.quickEntry')}
          </button>
        )}
        <button
          aria-pressed={mode === 'guided'}
          onClick={() => setMode('guided')}
        >
          <Clock3 size={15} /> {t('journal.guided')}
        </button>
      </div>
      {mode === 'guided' && session && (
        <p className="journal-draft-status" role="status">
          {saved ? 'Reflection saved on this device.' : 'Your guided draft saves automatically on this device.'}
        </p>
      )}
      {mode === 'quick' && subOn('chatJournal', 'quickEntry') ? (
        <>
          <MicroJournalComposer
            onSave={(entry) =>
              setData((current) => ({
                ...current,
                sessions: [...current.sessions, entry],
              }))
            }
            onGuided={() => {
              if (!session)
                setData((current) => ({
                  ...current,
                  draft: newSession(language),
                }))
              setMode('guided')
            }}
          />
          {microEntries.length > 0 && (
            <div className="micro-recent">
              <h3>{t('journal.recentMoments')}</h3>
              {microEntries.map((entry) => {
                const entryText = entry.messages.find(
                  (message) => message.sender === 'user',
                )?.text
                return (
                  <button
                    key={entry.metadata.id}
                    onClick={() => setSummary(entry)}
                  >
                    <span>
                      <strong>{entryText || t('journal.mediaMoment')}</strong>
                      <small>
                        {new Date(entry.metadata.date).toLocaleDateString()}
                        {entry.metadata.tags.length
                          ? ` · ${entry.metadata.tags.map((tag) => `#${tag}`).join(' ')}`
                          : ''}
                      </small>
                    </span>
                    {entry.metadata.attachments.length > 0 && (
                      <small className="attachment-count">
                        {t('journal.attachmentCount', {
                          count: entry.metadata.attachments.length,
                        })}
                      </small>
                    )}
                    <ArrowRight size={15} />
                  </button>
                )
              })}
            </div>
          )}
        </>
      ) : !session ? (
        <div className="journal-welcome">
          <div className="journal-illustration" aria-hidden="true">
            ✦<span>☾</span>✧
          </div>
          <h3>{t('journal.makeRoom')}</h3>
          <p>
            {t('ui.welcomeLine1')}
            <br />
            {t('ui.welcomeLine2')}
          </p>
          <button
            className="primary"
            onClick={() => {
              setData((d) => ({ ...d, draft: newSession(language) }))
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
                chips={subOn('chatJournal', 'promptChips') ? stepChips(session.flow.step, language) : []}
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
                onClick={saved ? () => setSummary(session) : save}
              >
                {saved ? t('journal.viewSaved') : t('journal.saveReview')}{' '}
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
                  {t('journal.anotherCheckIn')}
                </button>
              )}
            </div>
          )}
        </>
      )}
      {summary && (
        <SessionSummaryModal
          session={summary}
          onClose={() => setSummary(null)}
        />
      )}
    </section>
  )
}
