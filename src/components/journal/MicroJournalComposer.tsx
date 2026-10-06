import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Check, Mic, Plus, Save, Square, Tag, X } from 'lucide-react'
import { id, newMicroSession, type Session } from '../../model'
import i18n from '../../i18n'
import { saveJournalMedia, type PendingJournalMedia } from './journalMedia'

const QUICK_TAGS = ['grateful', 'calm', 'heavy', 'proud', 'idea', 'memory']
const QUICK_DRAFT_KEY = 'bloom-quick-journal-draft-v1'

function loadQuickDraft() {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(QUICK_DRAFT_KEY) ?? 'null')
    if (typeof raw !== 'object' || raw === null) return { text: '', tags: [] as string[], mood: null as number | null }
    const value = raw as Record<string, unknown>
    return {
      text: typeof value.text === 'string' ? value.text : '',
      tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 8) : [],
      mood: typeof value.mood === 'number' && value.mood >= 1 && value.mood <= 5 ? value.mood : null,
    }
  } catch {
    return { text: '', tags: [], mood: null }
  }
}

export function MicroJournalComposer({
  onSave,
  onGuided,
}: {
  onSave: (session: Session) => void
  onGuided: () => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  const moods = [
    t('journal.moodVeryLow'),
    t('journal.moodLow'),
    t('journal.moodOkay'),
    t('journal.moodGood'),
    t('journal.moodGreat'),
  ]
  const [initialDraft] = useState(loadQuickDraft)
  const [text, setText] = useState(initialDraft.text)
  const [tags, setTags] = useState<string[]>(initialDraft.tags)
  const [customTag, setCustomTag] = useState('')
  const [mood, setMood] = useState<number | null>(initialDraft.mood)
  const [media, setMedia] = useState<PendingJournalMedia[]>([])
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [notice, setNotice] = useState('')
  const [draftStatus, setDraftStatus] = useState(
    initialDraft.text || initialDraft.tags.length || initialDraft.mood !== null
      ? 'Draft restored. Text, tags, and mood save on this device.'
      : 'Your text, tags, and mood save on this device as you write.',
  )
  const [saving, setSaving] = useState(false)
  const mediaRef = useRef<PendingJournalMedia[]>([])
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const recordingStarted = useRef(0)

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(
      () =>
        setElapsed(Math.floor((Date.now() - recordingStarted.current) / 1000)),
      500,
    )
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    mediaRef.current = media
  }, [media])

  useEffect(() => {
    const hasContent = Boolean(text.trim() || tags.length || mood !== null)
    if (!hasContent) {
      try {
        localStorage.removeItem(QUICK_DRAFT_KEY)
        setDraftStatus('Your text, tags, and mood save on this device as you write.')
      } catch {
        setDraftStatus('Entry saved, but the local draft could not be cleared.')
      }
      return
    }
    setDraftStatus('Saving draft…')
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(QUICK_DRAFT_KEY, JSON.stringify({ text, tags, mood }))
        setDraftStatus('Draft saved on this device.')
      } catch {
        setDraftStatus('Draft could not be saved on this device.')
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [text, tags, mood])

  useEffect(
    () => () => {
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach((track) => track.stop())
      mediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    },
    [],
  )

  const toggleTag = (tag: string) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : current.length < 8
          ? [...current, tag]
          : current,
    )

  const addCustomTag = () => {
    const tag = customTag.trim().replace(/^#/, '').toLowerCase().slice(0, 30)
    if (tag && !tags.includes(tag) && tags.length < 8) setTags([...tags, tag])
    setCustomTag('')
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    const available = Math.max(
      0,
      4 - media.filter((item) => item.kind === 'photo').length,
    )
    const selected = [...files]
      .filter(
        (file) => file.type.startsWith('image/') && file.size <= 10_000_000,
      )
      .slice(0, available)
      .map((file): PendingJournalMedia => ({
        id: id(),
        kind: 'photo',
        name: file.name,
        mimeType: file.type,
        duration: null,
        blob: file,
        previewUrl: URL.createObjectURL(file),
      }))
    setMedia((current) => [...current, ...selected])
    if (selected.length < Math.min(files.length, available))
      setNotice(t('journal.photoLimit'))
    else setNotice('')
  }

  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setNotice(t('journal.voiceUnavailable'))
      return
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      chunks.current = []
      const next = new MediaRecorder(stream.current)
      recorder.current = next
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data)
      }
      next.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: next.mimeType || 'audio/webm',
        })
        const duration = Math.max(
          1,
          Math.round((Date.now() - recordingStarted.current) / 1000),
        )
        if (blob.size)
          setMedia((current) => {
            current
              .filter((item) => item.kind === 'audio')
              .forEach((item) => URL.revokeObjectURL(item.previewUrl))
            return [
              ...current.filter((item) => item.kind !== 'audio'),
              {
                id: id(),
                kind: 'audio',
                name: `${t('journal.voiceNote')} · ${duration}s`,
                mimeType: blob.type,
                duration,
                blob,
                previewUrl: URL.createObjectURL(blob),
              },
            ]
          })
        stream.current?.getTracks().forEach((track) => track.stop())
        stream.current = null
      }
      recordingStarted.current = Date.now()
      setElapsed(0)
      setNotice('')
      next.start()
      setRecording(true)
    } catch {
      setNotice(t('journal.microphoneDenied'))
    }
  }

  const stopRecording = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setRecording(false)
  }

  const removeMedia = (mediaId: string) =>
    setMedia((current) => {
      const removed = current.find((item) => item.id === mediaId)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return current.filter((item) => item.id !== mediaId)
    })

  const save = async () => {
    if (!text.trim() && !media.length) return
    setSaving(true)
    setNotice('')
    const metadata = media.map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      mimeType: item.mimeType,
      duration: item.duration,
    }))
    const session = newMicroSession(text, tags, metadata, mood)
    try {
      await saveJournalMedia(session.metadata.id, media)
      onSave(session)
      media.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setText('')
      setTags([])
      setMood(null)
      setMedia([])
      setNotice(t('journal.savedEntry'))
    } catch {
      setNotice(t('journal.mediaSaveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="micro-journal flex flex-col gap-4 bloom-stack">
      <div className="micro-mood" aria-label={t('journal.feeling')}>
        {moods.map((label, index) => (
          <button
            key={label}
            aria-label={label}
            aria-pressed={mood === index + 1}
            onClick={() => setMood(mood === index + 1 ? null : index + 1)}
            title={label}
          >
            {['😞', '🙁', '😐', '🙂', '😊'][index]}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor="micro-journal-text">
        {t('journal.quickEntryLabel')}
      </label>
      <textarea
        id="micro-journal-text"
        rows={5}
        maxLength={2000}
        placeholder={t('journal.quickPlaceholder')}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <p className="micro-draft-status" role="status" aria-live="polite">{draftStatus}</p>
      <div className="quick-tags" aria-label={t('journal.quickTags')}>
        <Tag size={15} aria-hidden="true" />
        {QUICK_TAGS.map((tag) => (
          <button
            key={tag}
            aria-pressed={tags.includes(tag)}
            onClick={() => toggleTag(tag)}
          >
            #{t(`journal.quickTag.${tag}`)}
          </button>
        ))}
        <div className="custom-tag">
          <input
            aria-label={t('journal.customTag')}
            placeholder={t('journal.customTag')}
            maxLength={31}
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustomTag()
              }
            }}
          />
          <button aria-label={t('journal.addCustomTag')} onClick={addCustomTag}>
            <Plus size={14} />
          </button>
        </div>
      </div>
      {media.length > 0 && (
        <div className="pending-media" aria-label={t('journal.mediaReady')}>
          {media.map((item) => (
            <div key={item.id} className={item.kind}>
              {item.kind === 'photo' ? (
                <img src={item.previewUrl} alt={item.name} />
              ) : (
                <audio controls src={item.previewUrl} />
              )}
              <button
                aria-label={t('journal.removeMedia', { name: item.name })}
                onClick={() => removeMedia(item.id)}
              >
                <X size={14} />
              </button>
              <small>
                {item.kind === 'audio' ? item.name : t('journal.photoLabel')}
              </small>
            </div>
          ))}
        </div>
      )}
      <div className="micro-actions bloom-inline">
        <label className="media-action">
          <Camera size={17} /> {t('journal.photo')}
          <input
            type="file"
            accept="image/*"
            multiple
            aria-label={t('journal.addPhotos')}
            onChange={(event) => {
              addPhotos(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
        <button
          className={`media-action ${recording ? 'recording' : ''}`}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? <Square size={15} /> : <Mic size={17} />}
          {recording
            ? t('journal.stopRecording', { seconds: elapsed })
            : t('journal.voice')}
        </button>
        <button
          className="primary micro-save"
          disabled={saving || (!text.trim() && !media.length)}
          onClick={() => void save()}
        >
          {saving ? <Check size={17} /> : <Save size={17} />}
          {saving ? t('journal.saving') : t('journal.saveEntry')}
        </button>
      </div>
      <p className="micro-notice" role="status">
        {notice}
      </p>
      <button className="guided-link" onClick={onGuided}>
        {t('journal.preferGuided')} <strong>{t('journal.checkIn')}</strong>
      </button>
    </div>
  )
}
