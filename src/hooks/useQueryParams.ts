// @utils/useQueryParams.ts
import { useEffect, useState } from 'react'

export function useQueryParams() {
  const [search, setSearch] = useState(() => window.location.search)

  useEffect(() => {
    const handle = () => setSearch(window.location.search)
    window.addEventListener('popstate', handle)
    window.addEventListener('querychange', handle)
    return () => {
      window.removeEventListener('popstate', handle)
      window.removeEventListener('querychange', handle)
    }
  }, [])

  // Expose both raw string and helper
  const params = new URLSearchParams(search)
  return {
    params,
    toString: () => params.toString(),
    get: (key: string) => params.get(key),
  }
}
