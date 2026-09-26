import type { Dispatch, SetStateAction } from 'react'
import type { AppData } from '../../model'
import type { NavKey } from '../../components/layout/Sidebar'

/** Props every lazily loaded feature page receives from the app shell. */
export type FeaturePageProps = {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  today: string
  onNavigate: (key: NavKey) => void
}
