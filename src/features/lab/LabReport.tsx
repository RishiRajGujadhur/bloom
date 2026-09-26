import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import { metrics, type Row } from './labModel'

const s = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Helvetica', fontSize: 10, color: '#2b2230', lineHeight: 1.5 },
  title: { fontSize: 26, fontFamily: 'Times-Bold', color: '#d0643f' },
  sub: { fontSize: 10, color: '#6b5d52', marginBottom: 20 },
  h: { fontSize: 14, fontFamily: 'Times-Bold', marginTop: 16, marginBottom: 8 },
  finding: { marginBottom: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#d0643f' },
  table: { borderWidth: 1, borderColor: '#eadfd4' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eadfd4' },
  th: { flex: 1, padding: 4, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  td: { flex: 1, padding: 4, fontSize: 8 },
  foot: { position: 'absolute', bottom: 24, left: 44, right: 44, fontSize: 8, color: '#9a8f86', textAlign: 'center' },
})

const avg = (rows: Row[], id: (typeof metrics)[number]['id']) => {
  const v = rows.map((r) => r[id]).filter((x): x is number => x != null)
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '—'
}

function Report({ rows, findings }: { rows: Row[]; findings: string[] }) {
  return (
    <Document title="Bloom insights report">
      <Page size="A4" style={s.page}>
        <Text style={s.title}>Your patterns</Text>
        <Text style={s.sub}>
          {rows[0]?.date} to {rows[rows.length - 1]?.date} · {rows.length} days · generated on your device
        </Text>
        <Text style={s.h}>What moves together</Text>
        {findings.length ? findings.map((f) => <Text key={f} style={s.finding}>{f}</Text>) : <Text>Not enough overlapping days yet. Keep logging for a week or two.</Text>}
        <Text style={s.h}>Averages</Text>
        <View style={s.table}>
          <View style={s.tr}>
            {metrics.slice(0, 5).map((m) => (
              <Text key={m.id} style={s.th}>{m.label}</Text>
            ))}
          </View>
          <View style={s.tr}>
            {metrics.slice(0, 5).map((m) => (
              <Text key={m.id} style={s.td}>{avg(rows, m.id)} {m.unit}</Text>
            ))}
          </View>
          <View style={s.tr}>
            {metrics.slice(5).map((m) => (
              <Text key={m.id} style={s.th}>{m.label}</Text>
            ))}
          </View>
          <View style={s.tr}>
            {metrics.slice(5).map((m) => (
              <Text key={m.id} style={s.td}>{avg(rows, m.id)} {m.unit}</Text>
            ))}
          </View>
        </View>
        <Text style={s.h}>Daily log</Text>
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={s.th}>Date</Text>
            {metrics.map((m) => (
              <Text key={m.id} style={s.th}>{m.label}</Text>
            ))}
          </View>
          {rows.slice(-21).map((r) => (
            <View key={r.date} style={s.tr} wrap={false}>
              <Text style={s.td}>{r.date.slice(5)}</Text>
              {metrics.map((m) => (
                <Text key={m.id} style={s.td}>{r[m.id] == null ? '·' : Math.round((r[m.id] as number) * 10) / 10}</Text>
              ))}
            </View>
          ))}
        </View>
        <Text style={s.foot} fixed>Correlation is not causation. These are gentle hints, not diagnoses.</Text>
      </Page>
    </Document>
  )
}

export const renderLabReport = (rows: Row[], findings: string[]) => pdf(<Report rows={rows} findings={findings} />).toBlob()
