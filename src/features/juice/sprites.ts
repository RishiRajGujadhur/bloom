/**
 * Hand-drawn pixel art, one character per pixel. Rendered as crisp SVG rects
 * (no image files), in three parallax layers: shadow, body and highlight.
 *   .  transparent   k outline   w white highlight   others: palette below
 */
export type Sprite = { id: string; name: string; rows: string[]; palette: Record<string, string> }

const outline = '#2b2230'

export const sprites: Sprite[] = [
  {
    id: 'sword',
    name: 'Sword',
    palette: { k: outline, s: '#dfe6ee', m: '#9aa8b8', g: '#f2c14e', b: '#8a5a3b', w: '#ffffff' },
    rows: [
      '..........kk',
      '.........kwk',
      '........kwsk',
      '.......kwsk.',
      '......kwsk..',
      '..k..kwsk...',
      '..kkkwsk....',
      '...kgmk.....',
      '..kbkgk.....',
      '.kbk.kk.....',
      'kbk.........',
      'kk..........',
    ],
  },
  {
    id: 'potion',
    name: 'Potion',
    palette: { k: outline, c: '#b07b6b', g: '#dfe6ee', p: '#e27396', d: '#b44b72', w: '#ffffff' },
    rows: [
      '....kkkk....',
      '....kcck....',
      '....kkkk....',
      '....kggk....',
      '...kggggk...',
      '..kgwggggk..',
      '.kpwpppppk..',
      '.kpwppppdpk.',
      '.kpppppppdk.',
      '.kdpppppddk.',
      '..kddddddk..',
      '...kkkkkk...',
    ],
  },
  {
    id: 'star',
    name: 'Star',
    palette: { k: outline, y: '#f2c14e', o: '#e0903a', w: '#fff6c8' },
    rows: [
      '.....kk.....',
      '....kwyk....',
      '....kwyk....',
      'kkkkkwyykkkk',
      'kwwyyyyyyyok',
      '.kyyyyyyyok.',
      '..kyyyyyok..',
      '..kyyyyyyk..',
      '.kyyyokyyyk.',
      '.kyok..koyk.',
      'kok......kok',
      'kk........kk',
    ],
  },
  {
    id: 'gem',
    name: 'Gem',
    palette: { k: outline, a: '#7fd1e8', b: '#3f9fc7', d: '#2a6f9a', w: '#ffffff' },
    rows: [
      '............',
      '...kkkkkk...',
      '..kwaaabbk..',
      '.kwaaaabbbk.',
      'kkkkkkkkkkkk',
      'kaaawabbbddk',
      '.kaaabbbddk.',
      '..kaabbddk..',
      '...kabbdk...',
      '....kbdk....',
      '.....kk.....',
      '............',
    ],
  },
  {
    id: 'heart',
    name: 'Heart',
    palette: { k: outline, r: '#e2556f', d: '#b0344f', w: '#ffd0d8' },
    rows: [
      '............',
      '.kkk....kkk.',
      'kwwrk..krrrk',
      'kwrrrkkrrrdk',
      'krrrrrrrrrdk',
      'krrrrrrrrrdk',
      '.krrrrrrrdk.',
      '..krrrrrdk..',
      '...krrrdk...',
      '....krdk....',
      '.....kk.....',
      '............',
    ],
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    palette: { k: outline, r: '#d9534f', w: '#ffffff', c: '#f3e3c7', d: '#c9b08a' },
    rows: [
      '....kkkk....',
      '..kkrrrrkk..',
      '.krrwwrrrrk.',
      'krrwwwrrwwrk',
      'krrrwrrrwwrk',
      'krrrrrrrrrrk',
      'kkkkkkkkkkkk',
      '...kcccck...',
      '...kckcck...',
      '...kccdck...',
      '...kcccdk...',
      '....kkkk....',
    ],
  },
]

export const chest: Sprite = {
  id: 'chest',
  name: 'Treasure chest',
  palette: { k: outline, b: '#8a5a3b', l: '#b07b4b', g: '#f2c14e', y: '#fff6c8', d: '#5e3b26' },
  rows: [
    '..kkkkkkkkkk..',
    '.kllllllllllk.',
    'kllbbbbbbbbllk',
    'klbbbbbbbbbblk',
    'kkkkkkggkkkkkk',
    'kgggggkykggggk',
    'kbbbbbkgkbbbbk',
    'kbbbbbbkbbbbbk',
    'kbbbbbbbbbbbbk',
    'kbdbbbbbbbbdbk',
    'kgggggggggggggk'.slice(0, 14),
    'kkkkkkkkkkkkkk',
  ],
}

export const pickSprite = (seed: number) => sprites[Math.abs(Math.floor(seed)) % sprites.length]
