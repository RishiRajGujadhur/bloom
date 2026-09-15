// Original grid-native vector sprite sheets: 32x32 pixels per frame, 4 frames per row.
import { writeFileSync } from 'node:fs'
const colors = { ink:'#27233f', skin:'#edba8a', light:'#ffdaac', hair:'#5b3654', shoes:'#433858' }
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`
function hero(tier, frame, row) {
  const coat = ['#7f5abc','#5bbda1','#f4c76d'][tier], shade=['#573c89','#318982','#c78b45'][tier]
  const bob = row === 2 ? [0,-2,-3,-1][frame] : row === 3 ? [0,-1,0,-1][frame] : frame%2 ? -1:0
  let art = rect(8,29,17,2,'#25253c55')
  const R=(x,y,w,h,c)=>{art+=rect(x,y+bob,w,h,c)}
  if(tier===2) { R(5,12,2,2,'#f3c668'); R(25,6+frame,1,3,'#c5efc0'); R(7+frame,3,2,2,'#fae5ab') }
  R(11,18,11,9,colors.ink); R(12,23,4,6,shade); R(18,23,4,6,shade)
  R(10,28+(row===3?frame%2:0),6,2,colors.shoes); R(18,28-(row===3?frame%2:0),6,2,colors.shoes)
  R(10,15,13,9,colors.ink); R(11,16,11,7,coat); R(12,16,2,6,tier===0?'#b58cda':'#b8e6cb'); R(11,22,11,2,shade); R(16,22,2,2,'#ffe299')
  R(10,5,12,11,colors.ink); R(11,6,10,9,colors.skin); R(11,6,10,3,colors.hair); R(10,8,3,4,colors.hair); R(19,8,3,3,colors.hair)
  R(13,10,2,2,colors.ink); R(18,10,2,2,colors.ink); R(16,13,2,1,'#ad715c'); R(13,9,1,1,colors.light)
  if(tier>0) { R(9,5,14,3,shade); R(10,4,12,2,coat); R(15,2,3,4,tier===1?'#dcf0ec':'#fff1b3'); R(12,7,8,1,'#c6e9df') }
  const raised = row===2 || (row===1 && frame>0)
  R(8,raised?11:17,3,6,shade); R(8,raised?10:22,3,2,colors.skin)
  R(23,raised?10:17,3,6,coat); R(23,raised?9:22,3,2,colors.skin)
  const swordX=row===1&&frame>1?28:25
  R(swordX,raised?1:12,2,10,'#d0e6ef'); R(swordX-1,raised?10:21,4,2,'#f4d27a'); R(swordX,raised?12:23,2,3,colors.hair)
  if(row===1&&frame===2){ R(29,5,2,2,'#fff0b7'); R(28,7,3,1,'#fff0b7') }
  return art
}
function sheet(name, draw, rows=1){ let body=''; for(let y=0;y<rows;y++)for(let x=0;x<4;x++)body+=`<g transform="translate(${x*32} ${y*32})">${draw(x,y)}</g>`;writeFileSync(new URL(`../public/rpg/${name}.svg`,import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="${rows*32}" viewBox="0 0 128 ${rows*32}" shape-rendering="crispEdges">${body}</svg>`) }
for(let tier=0;tier<3;tier++)sheet(`hero-${tier}`,(f,r)=>hero(tier,f,r),4)
sheet('boss',(f)=>{let a='',b=f%2;const R=(x,y,w,h,c)=>{a+=rect(x,y+b,w,h,c)};R(5,27,23,3,'#32234844');R(6,11,22,14,'#47395f');R(8,7,18,20,'#755591');R(10,6,14,2,'#a177b0');R(3,14,5,10,'#755591');R(26,14,4,10,'#755591');R(8,24,6,5,'#47395f');R(21,24,6,5,'#47395f');R(11,13,5,3,'#f2bc73');R(20,13,5,3,'#f2bc73');R(13,13,2,3,'#332540');R(20,13,2,3,'#332540');R(15,21,5,2,'#44304e');R(7,4,4,6,'#d5b5cf');R(23,4,4,6,'#d5b5cf');return a})
sheet('chest',(f)=>rect(4,24,25,4,'#31223e44')+rect(4,12-f%2,24,14,'#56334f')+rect(5,13-f%2,22,11,'#bb7952')+rect(5,13,22,3,'#e9b766')+rect(8,12,3,13,'#f4d18b')+rect(22,12,3,13,'#f4d18b')+rect(14,16,5,5,'#56334f')+rect(15,16,3,3,'#ffe9ad')+rect(8+f*4,5,2,2,'#f0cf91'))
sheet('fox',(f)=>{let b=f%2;return rect(6,25,20,2,'#31223e44')+rect(22,14+b,6,9,'#d8844d')+rect(26,12+b,3,5,'#fff0c4')+rect(9,13+b,15,11,'#e69b55')+rect(8,7+b,5,9,'#dc874e')+rect(20,7+b,5,9,'#dc874e')+rect(12,19+b,9,5,'#fff0cc')+rect(12,15+b,2,2,'#35263f')+rect(20,15+b,2,2,'#35263f')+rect(16,18+b,2,2,'#35263f')})
sheet('spirit',(f)=>{const b=[0,-1,-2,-1][f];return rect(7,26,19,2,'#31223e44')+rect(10,7+b,13,17,'#c2e5d8')+rect(7,11+b,19,10,'#c2e5d8')+rect(11,5+b,10,2,'#e7ffee')+rect(10,21+b,4,5,'#c2e5d8')+rect(19,21+b,4,5,'#c2e5d8')+rect(11,12+b,3,3,'#547781')+rect(20,12+b,3,3,'#547781')+rect(15,17+b,3,1,'#547781')})
