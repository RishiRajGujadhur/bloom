import { useEffect, useRef, useState } from 'react'
type Characteristic = EventTarget & { value?: DataView; startNotifications: () => Promise<Characteristic>; stopNotifications: () => Promise<Characteristic>; writeValueWithResponse: (value: Uint8Array<ArrayBuffer>) => Promise<void> }
type Server = { connect: () => Promise<Server>; disconnect: () => void; getPrimaryService: (uuid: string) => Promise<{ getCharacteristic: (uuid: string) => Promise<Characteristic> }> }
type Device = EventTarget & { name?: string; gatt?: Server }
type Bluetooth = { requestDevice: (options: { filters: { services: string[] }[] }) => Promise<Device> }
const bluetooth = () => (navigator as Navigator & { bluetooth?: Bluetooth }).bluetooth
export type SilentAlert = 'set' | 'goal' | 'form'
export function heartRate(data: DataView): number | null {
  if (data.byteLength < 2) return null
  const flags = data.getUint8(0)
  if ((flags & 4) && !(flags & 2)) return null
  if ((flags & 1) && data.byteLength < 3) return null
  const bpm = flags & 1 ? data.getUint16(1, true) : data.getUint8(1)
  return bpm > 20 && bpm < 250 ? bpm : null
}
export function vibrationBytes(text: string) {
  const normalized = text.replace(/\s/g, '')
  if (!/^(?:[0-9a-f]{2}){1,32}$/i.test(normalized)) throw new Error('Use 1–32 hexadecimal bytes from your companion’s vibration protocol.')
  return new Uint8Array(normalized.match(/../g)!.map(byte => parseInt(byte, 16)))
}
export function CoachWearables({ enabled, onReady }: { enabled: boolean; onReady: (notify: (kind: SilentAlert) => void) => void }) {
  const [service, setService] = useState(''), [characteristic, setCharacteristic] = useState(''), [command, setCommand] = useState('01')
  const [status, setStatus] = useState('No silent wearable connected'), [bpm, setBpm] = useState<number | null>(null), [hrStatus, setHrStatus] = useState('Heart-rate monitor disconnected')
  const hapticDevice = useRef<Device | null>(null), hrDevice = useRef<Device | null>(null), vibration = useRef<Characteristic | null>(null), hr = useRef<Characteristic | null>(null)
  const hrListener = useRef<(() => void) | null>(null), lastAlert = useRef(-Infinity), lastPulseAt = useRef(0), generation = useRef(0)
  const enabledRef = useRef(enabled), commandRef = useRef(command); enabledRef.current = enabled; commandRef.current = command
  const disconnect = () => { generation.current++; hapticDevice.current?.gatt?.disconnect(); vibration.current = null; hapticDevice.current = null; setStatus('No silent wearable connected') }
  const disconnectHR = () => { if (hr.current && hrListener.current) hr.current.removeEventListener('characteristicvaluechanged', hrListener.current); void hr.current?.stopNotifications().catch(() => {}); hrDevice.current?.gatt?.disconnect(); hrDevice.current = null; hr.current = null; setBpm(null); setHrStatus('Heart-rate monitor disconnected') }
  useEffect(() => {
    onReady(kind => {
      if (!enabledRef.current || !vibration.current || performance.now() - lastAlert.current < 10000) return
      lastAlert.current = performance.now()
      try { void vibration.current.writeValueWithResponse(vibrationBytes(commandRef.current)).then(() => setStatus(`Silent ${kind} alert sent`)).catch(() => { vibration.current = null; setStatus('Wearable write failed. Reconnect your companion.') }) }
      catch (error) { setStatus(error instanceof Error ? error.message : 'Invalid vibration command') }
    })
    const interval = setInterval(() => { if (lastPulseAt.current && performance.now() - lastPulseAt.current > 10000) setBpm(null) }, 2000)
    // The counter intentionally invalidates pending async connections during teardown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { generation.current++; clearInterval(interval); hapticDevice.current?.gatt?.disconnect(); if (hr.current && hrListener.current) hr.current.removeEventListener('characteristicvaluechanged', hrListener.current); void hr.current?.stopNotifications().catch(() => {}); hrDevice.current?.gatt?.disconnect(); onReady(() => {}) }
  }, [onReady])
  const connectVibration = async () => {
    const api = bluetooth(); if (!api) { setStatus('Web Bluetooth is unavailable in this browser. Try a supported desktop Chromium browser.'); return }
    try {
      vibrationBytes(command); const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuid.test(service) || !uuid.test(characteristic)) throw new Error('Enter your companion’s full service and vibration characteristic UUIDs.')
      disconnect(); const run = generation.current, device = await api.requestDevice({ filters: [{ services: [service] }] })
      if (run !== generation.current) return
      hapticDevice.current = device; const server = await device.gatt?.connect(); const svc = await server?.getPrimaryService(service); const channel = await svc?.getCharacteristic(characteristic)
      if (run !== generation.current) { device.gatt?.disconnect(); return }
      if (!channel) throw new Error('Vibration service unavailable')
      vibration.current = channel; device.addEventListener('gattserverdisconnected', () => { if (device === hapticDevice.current) { vibration.current = null; setStatus('Wearable disconnected') } }); setStatus(`${device.name ?? 'Wearable'} vibration channel connected`)
    } catch (error) { disconnect(); setStatus(error instanceof Error ? error.message : 'Wearable connection failed') }
  }
  const connectHR = async () => {
    const api = bluetooth(); if (!api) { setHrStatus('Web Bluetooth unavailable'); return }
    try {
      disconnectHR(); const run = generation.current, device = await api.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      if (run !== generation.current) return
      hrDevice.current = device; const server = await device.gatt?.connect(); const svc = await server?.getPrimaryService('heart_rate'); const channel = await svc?.getCharacteristic('heart_rate_measurement')
      if (!channel || run !== generation.current) { device.gatt?.disconnect(); return }
      hr.current = channel; const changed = () => { lastPulseAt.current = performance.now(); setBpm(channel.value ? heartRate(channel.value) : null) }; hrListener.current = changed
      channel.addEventListener('characteristicvaluechanged', changed); await channel.startNotifications(); setHrStatus(`${device.name ?? 'Monitor'} connected`)
      device.addEventListener('gattserverdisconnected', () => { if (device === hrDevice.current) { setBpm(null); setHrStatus('Heart-rate monitor disconnected') } })
    } catch (error) { disconnectHR(); setHrStatus(error instanceof Error ? error.message : 'Monitor connection failed') }
  }
  return <details className="fc-diagnostics"><summary>Silent wearable & heart-rate connections</summary><p>Smartwatch vibration requires a companion exposing a writable Bluetooth vibration characteristic. Standard watch pairing alone cannot provide browser haptics. Use its documented silent command.</p><label>Companion service UUID<input value={service} onChange={e => setService(e.target.value.trim())} /></label><label>Vibration characteristic UUID<input value={characteristic} onChange={e => setCharacteristic(e.target.value.trim())} /></label><label>Silent vibration command (hex)<input value={command} onChange={e => setCommand(e.target.value)} /></label><button onClick={() => void connectVibration()}>Connect silent wearable</button><button onClick={disconnect}>Disconnect wearable</button><p role="status">{status}{!enabled && ' · alerts disabled in settings'}</p><button onClick={() => void connectHR()}>Connect heart-rate monitor</button><button onClick={disconnectHR}>Disconnect heart-rate monitor</button><p role="status">{hrStatus} · {bpm == null ? 'No current pulse reading' : `${bpm} BPM`}</p><small>No voice or audio signals are sent. Devices must support these Bluetooth services.</small></details>
}
