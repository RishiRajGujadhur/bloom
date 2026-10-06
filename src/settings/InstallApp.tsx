import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { canInstall, promptInstall } from '../components/ui/appHealth'

/** "Install Bloom" — shown when the browser offers installation (PWA). */
export function InstallApp() {
  const [ok, setOk] = useState(canInstall)
  useEffect(() => {
    const f = () => setOk(canInstall())
    window.addEventListener('bloom:installable', f)
    return () => window.removeEventListener('bloom:installable', f)
  }, [])
  const standalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
  return (
    <section className="data-reset bloom-stack" aria-labelledby="install-heading">
      <h2 id="install-heading" style={{ color: 'inherit' }}><Download size={18} aria-hidden="true" /> Install Bloom</h2>
      <p>{standalone ? 'Bloom is installed — it opens in its own window and works offline.' : 'Add Bloom to your home screen or desktop. It opens in its own window and works offline.'}</p>
      {!standalone && (ok ? <button type="button" className="studio-btn" onClick={async () => setOk(!(await promptInstall()))}>Install</button> : <small>Use your browser’s “Install app” or “Add to Home Screen” menu.</small>)}
    </section>
  )
}
