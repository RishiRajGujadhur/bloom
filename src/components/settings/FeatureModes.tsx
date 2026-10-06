import { DropdownSelect } from '../ui/DropdownSelect'
import { useState } from 'react'
import { pageDetails } from '../layout/FeatureGuide'
import type { NavKey } from '../layout/Sidebar'
import { PageModeContext, PageModeSwitch, usePageModeState } from '../ui/PageMode'

/** One shared preference editor for every routed feature, including Settings. */
export function FeatureModes() {
  const [page, setPage] = useState<NavKey>('settings')
  const state = usePageModeState(page)
  return <section className="card feature-mode-settings" aria-labelledby="feature-modes-heading">
    <h2 id="feature-modes-heading">Feature modes</h2>
    <p>Choose Basic for essentials or Advanced for all tools. Each feature remembers its own choice.</p>
    <label>Feature
      <DropdownSelect aria-label="Feature" value={page} onChange={event => setPage(event.target.value as NavKey)}>
        {(Object.keys(pageDetails) as NavKey[]).sort((a, b) => pageDetails[a].title.localeCompare(pageDetails[b].title)).map(key => <option key={key} value={key}>{pageDetails[key].title}</option>)}
      </DropdownSelect>
    </label>
    <PageModeContext.Provider value={state}><PageModeSwitch /></PageModeContext.Provider>
  </section>
}
