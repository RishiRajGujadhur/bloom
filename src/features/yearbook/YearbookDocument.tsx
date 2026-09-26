import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { YearbookChapters, YearbookData } from './yearbookModel'

/**
 * The printable book. Uses the PDF standard fonts (no network), A5 pages
 * like a paperback, running headers and page numbers.
 */
const s = StyleSheet.create({
  page: { paddingTop: 54, paddingBottom: 56, paddingHorizontal: 50, fontFamily: 'Times-Roman', fontSize: 11, lineHeight: 1.55, color: '#2b2230' },
  header: { position: 'absolute', top: 24, left: 50, right: 50, fontSize: 8, color: '#9a8f86', flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Helvetica' },
  folio: { position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#9a8f86', fontFamily: 'Helvetica' },
  cover: { padding: 0, backgroundColor: '#fbf6f1' },
  coverInner: { flex: 1, margin: 28, borderWidth: 2, borderColor: '#d0643f', padding: 40, justifyContent: 'center' },
  coverYear: { fontSize: 64, color: '#d0643f', fontFamily: 'Times-Bold' },
  coverTitle: { fontSize: 26, marginTop: 10, fontFamily: 'Times-Bold' },
  coverAuthor: { fontSize: 13, marginTop: 24, color: '#6b5d52', fontFamily: 'Helvetica' },
  chapter: { fontSize: 22, fontFamily: 'Times-Bold', color: '#d0643f', marginBottom: 18 },
  entryTitle: { fontSize: 14, fontFamily: 'Times-Bold', marginTop: 14 },
  date: { fontSize: 9, color: '#9a8f86', fontFamily: 'Helvetica', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  h: { fontSize: 13, fontFamily: 'Times-Bold', marginTop: 8, marginBottom: 2 },
  p: { marginBottom: 6 },
  li: { marginLeft: 12, marginBottom: 3 },
  quote: { marginLeft: 12, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#d0643f', fontFamily: 'Times-Italic', marginBottom: 6 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', padding: 12, borderWidth: 1, borderColor: '#eadfd4', borderRadius: 6 },
  statValue: { fontSize: 24, fontFamily: 'Times-Bold', color: '#d0643f' },
  statLabel: { fontSize: 9, fontFamily: 'Helvetica', color: '#6b5d52' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 110, marginTop: 20, gap: 6 },
  bar: { flex: 1, backgroundColor: '#d0643f', borderRadius: 2 },
  barLabel: { fontSize: 7, textAlign: 'center', fontFamily: 'Helvetica', color: '#9a8f86', marginTop: 4 },
  note: { marginBottom: 8, fontFamily: 'Times-Italic' },
})

function Frame({ book, chapter, children }: { book: YearbookData; chapter: string; children: React.ReactNode }) {
  return (
    <Page size="A5" style={s.page} wrap>
      <View style={s.header} fixed>
        <Text>{book.title}</Text>
        <Text>{chapter}</Text>
      </View>
      {children}
      <Text style={s.folio} fixed render={({ pageNumber }) => `${pageNumber}`} />
    </Page>
  )
}

const pretty = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })

export function YearbookDocument({ book, chapters }: { book: YearbookData; chapters: YearbookChapters }) {
  return (
    <Document title={`${book.title} ${book.year}`} author={book.author} creator="Bloom">
      <Page size="A5" style={[s.page, s.cover]}>
        <View style={s.coverInner}>
          <Text style={s.coverYear}>{book.year}</Text>
          <Text style={s.coverTitle}>{book.title}</Text>
          <Text style={s.coverAuthor}>{book.author || 'A year with Bloom'}</Text>
        </View>
      </Page>
      {chapters.stats && (
        <Frame book={book} chapter="The year in numbers">
          <Text style={s.chapter}>The year in numbers</Text>
          <View style={s.statGrid}>
            {book.stats.map((stat) => (
              <View key={stat.label} style={s.stat}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          {chapters.moods && book.moodByMonth.some((m) => m.average !== null) && (
            <View>
              <Text style={[s.entryTitle, { marginTop: 24 }]}>Mood by month</Text>
              <View style={s.bars}>
                {book.moodByMonth.map((m) => (
                  <View key={m.month} style={{ flex: 1 }}>
                    <View style={[s.bar, { height: m.average ? m.average * 20 : 2, opacity: m.average ? 1 : 0.2 }]} />
                    <Text style={s.barLabel}>{m.month}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Frame>
      )}
      {chapters.daybook && book.daybook.length > 0 && (
        <Frame book={book} chapter="Daybook">
          <Text style={s.chapter}>Daybook</Text>
          {book.daybook.map((page, i) => (
            <View key={i} wrap>
              <Text style={s.entryTitle}>{page.title}</Text>
              <Text style={s.date}>{pretty(page.date)}</Text>
              {page.blocks.map((b, j) => (
                <Text key={j} style={s[b.kind]}>
                  {b.kind === 'li' ? `•  ${b.text}` : b.text}
                </Text>
              ))}
            </View>
          ))}
        </Frame>
      )}
      {chapters.journal && book.journal.length > 0 && (
        <Frame book={book} chapter="Reflections">
          <Text style={s.chapter}>Reflections</Text>
          {book.journal.map((entry, i) => (
            <View key={i} wrap={false} style={{ marginBottom: 10 }}>
              <Text style={s.date}>{pretty(entry.date)}</Text>
              <Text style={s.p}>{entry.text}</Text>
              {entry.tags.length > 0 && <Text style={s.date}>{entry.tags.join('  ')}</Text>}
            </View>
          ))}
        </Frame>
      )}
      {chapters.gratitude && book.gratitude.length > 0 && (
        <Frame book={book} chapter="Good things">
          <Text style={s.chapter}>Good things</Text>
          {book.gratitude.map((g, i) => (
            <Text key={i} style={s.note}>
              “{g.text}” — {pretty(g.date)}
            </Text>
          ))}
        </Frame>
      )}
    </Document>
  )
}

export async function renderYearbook(book: YearbookData, chapters: YearbookChapters) {
  return pdf(<YearbookDocument book={book} chapters={chapters} />).toBlob()
}
