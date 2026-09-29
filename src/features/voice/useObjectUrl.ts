import { useEffect, useState } from 'react'

/** An object URL for a blob that lives exactly as long as the blob is in use (StrictMode-safe). */
export function useObjectUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) { setUrl(null); return }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    // Revoke a little later: players using the old URL are torn down in the same commit.
    return () => { setTimeout(() => URL.revokeObjectURL(u), 3000) }
  }, [blob])
  return url
}

