import { readFileSync, writeFileSync } from 'node:fs'
const path = new URL('../src/App.tsx',import.meta.url)
const source=readFileSync(path,'utf8')
const start=source.indexOf('            <section className="hero">')
const end=source.indexOf('            </section>',start)
if(start<0||end<0)throw Error('Hero block not found')
writeFileSync(path,source.slice(0,start)+'            <RpgDashboard data={data} setData={setData} onReflect={() => jump(\'journal\')} />\n'+source.slice(end+'            </section>\n'.length))
