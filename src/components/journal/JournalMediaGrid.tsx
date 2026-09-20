import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileAudio, Image as ImageIcon } from 'lucide-react'
import type { JournalAttachmentMeta } from '../../model'
import type { JournalAttachment } from '../../search/db'
import { loadJournalMedia } from './journalMedia'
import i18n from '../../i18n'

type LoadedMedia = JournalAttachment & { url: string }

export function JournalMediaGrid({
  attachments,
}: {
  attachments: JournalAttachmentMeta[]
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [media, setMedia] = useState<LoadedMedia[]>([])
  useEffect(() => {
    let active = true
    const urls: string[] = []
    void loadJournalMedia(attachments.map((item) => item.id)).then((rows) => {
      if (!active) return
      setMedia(
        rows.map((row) => {
          const url = URL.createObjectURL(row.blob)
          urls.push(url)
          return { ...row, url }
        }),
      )
    })
    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [attachments])

  if (!attachments.length) return null
  return (
    <div className="journal-media-grid" aria-label={t('journal.mediaReady')}>
      {media.map((item) =>
        item.kind === 'photo' ? (
          <figure key={item.id}>
            <img src={item.url} alt={item.name || t('journal.photoLabel')} />
            <figcaption>
              <ImageIcon size={12} /> {item.name}
            </figcaption>
          </figure>
        ) : (
          <div className="journal-audio" key={item.id}>
            <span>
              <FileAudio size={15} /> {t('journal.voiceNote')}
              {item.duration ? ` · ${item.duration}s` : ''}
            </span>
            <audio controls preload="metadata" src={item.url}>
              Your browser does not support audio playback.
            </audio>
          </div>
        ),
      )}
    </div>
  )
}
