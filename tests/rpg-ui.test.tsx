import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import { defaults, STORAGE_KEY } from '../src/model'
import { dayKey } from '../src/dates'

beforeEach(()=>{localStorage.clear();jest.useFakeTimers()})
afterEach(()=>jest.useRealTimers())
test('habit click updates visible EXP/stat and undo reverses both',()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Move with intention/}))
  expect(screen.getByText('10 EXP')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('+10 EXP')
  fireEvent.click(screen.getByRole('button',{name:/Move with intention/}))
  expect(screen.getByText('0 EXP')).toBeInTheDocument()
})
test('committing a priority exposes boss HP; attacks and final priority trigger victory',()=>{
  const data=defaults();data.plans=[{id:'goal',title:'My critical task',date:dayKey(),done:false}]
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));render(<App/>)
  fireEvent.click(screen.getByRole('checkbox',{name:'My critical task'}))
  fireEvent.click(screen.getByRole('button',{name:/Commit today’s boss/}))
  expect(screen.getByRole('progressbar',{name:'Daily boss health'})).toHaveAttribute('value','90')
  for(const name of ['Move with intention','Stay hydrated','Take a mindful moment'])fireEvent.click(screen.getByRole('button',{name:new RegExp(name)}))
  expect(screen.getByRole('progressbar',{name:'Daily boss health'})).toHaveAttribute('value','30')
  fireEvent.click(screen.getByRole('button',{name:/01 My critical task/}))
  expect(screen.getByText('DEFEATED')).toBeInTheDocument()
  expect(screen.getByText('90 EXP')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:/Move with intention/}))
  expect(screen.queryByText('DEFEATED')).not.toBeInTheDocument()
  expect(screen.getByText('30 EXP')).toBeInTheDocument()
})
test('earned chest opens once and inventory palette/companion persist after reload',()=>{
  const data=defaults();data.rpg.loot=[{milestone:7,earnedAt:Date.now(),opened:false}]
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));const view=render(<App/>)
  fireEvent.click(screen.getByRole('button',{name:/7-day chest.*Ready to open/}))
  fireEvent.click(screen.getByRole('button',{name:'Open chest',exact:true}))
  expect(screen.getByText('New treasures unlocked!')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'Equip in inventory',exact:true}))
  const dialog=screen.getByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button',{name:'forest',exact:true}))
  fireEvent.click(within(dialog).getByRole('button',{name:'fox fox',exact:true}))
  expect(document.querySelector('.app-shell')).toHaveAttribute('data-palette','forest')
  view.unmount();render(<App/>)
  expect(screen.getByRole('img',{name:'fox companion'})).toBeInTheDocument()
  expect(screen.getByRole('button',{name:/7-day chest.*Collected/})).toBeInTheDocument()
})
test('unearned equipment and sound stay locked; rules explain time and HP',()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Inventory',exact:true}))
  expect(screen.getByRole('button',{name:/forest 7-day chest/})).toBeDisabled()
  expect(screen.getByRole('button',{name:/Unlock with the 30-day chest/})).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'Close dialog'}))
  fireEvent.click(screen.getByRole('button',{name:'How to play'}))
  expect(screen.getByRole('dialog')).toHaveTextContent('72 hours gives 1.5×')
  expect(screen.getByRole('dialog')).toHaveTextContent('Health never drops below 1')
})
test('the UI settles a missed boss after its day ends without requiring a click',async()=>{
  const midnight=new Date(2026,8,14,0,0).getTime();jest.setSystemTime(midnight-1000)
  const data=defaults();const yesterday=dayKey(new Date(midnight-1000))
  data.plans=[{id:'missed',title:'Missed',date:yesterday,done:false}]
  data.rpg.bosses[yesterday]={day:yesterday,habitIds:[],priorityIds:['missed'],startedAt:midnight-10000,defeated:false,settled:false,penalty:0}
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));render(<App/>)
  await act(async()=>jest.advanceTimersByTime(61000))
  expect(screen.getByText('95 / 100 HP')).toBeInTheDocument()
})
