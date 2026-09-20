import { db, type JournalAttachment } from '../../search/db'
import type { JournalAttachmentMeta } from '../../model'

export interface PendingJournalMedia extends JournalAttachmentMeta {
  blob: Blob
  previewUrl: string
}

export async function saveJournalMedia(
  sessionId: string,
  media: PendingJournalMedia[],
) {
  if (!media.length) return
  const createdAt = Date.now()
  await db.journal_attachments.bulkPut(
    media.map((item): JournalAttachment => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      mimeType: item.mimeType,
      duration: item.duration,
      blob: item.blob,
      sessionId,
      createdAt,
    })),
  )
}

export async function loadJournalMedia(ids: string[]) {
  if (!ids.length) return []
  const rows = await db.journal_attachments.bulkGet(ids)
  return rows.filter((row): row is JournalAttachment => Boolean(row))
}
