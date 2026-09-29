export type QuestGroup = 'JavaScript' | 'HTML' | 'CSS' | 'Flexbox'
export type QuestKind = 'gate' | 'stack' | 'landmarks' | 'form' | 'selector' | 'float' | 'cascade' | 'direction' | 'justify' | 'align'
export type QuestLevel = {
  number: number
  group: QuestGroup
  kind: QuestKind
  title: string
  lesson: string
  task: string
  options: string[]
  answer: string[]
  success: string
  hint: string
}

export const questLevels: QuestLevel[] = [
  {
    number: 3, group: 'JavaScript', kind: 'gate', title: 'The output gates',
    lesson: 'A condition chooses one branch. Only the matching gate opens.',
    task: 'Run this in your head: const n = 7; if (n > 5) { console.log("open") } else { console.log("closed") }',
    options: ['open', 'closed', '7'], answer: ['open'],
    success: '7 is greater than 5, so the first branch runs.', hint: 'Compare 7 with 5 before choosing a gate.',
  },
  {
    number: 4, group: 'HTML', kind: 'stack', title: 'Build the tag tower',
    lesson: 'HTML elements nest like boxes. Close the inner element before the outer one.',
    task: 'Place these tags in the order a valid heading inside a section would use.',
    options: ['</section>', '<h1>', '</h1>', '<section>'], answer: ['<section>', '<h1>', '</h1>', '</section>'],
    success: 'The h1 sits inside the section, and the closing tags unwind in reverse order.', hint: 'Open section, open heading, close heading, close section.',
  },
  {
    number: 5, group: 'HTML', kind: 'landmarks', title: 'Semantic site builder',
    lesson: 'Semantic tags describe each region of a page to browsers and assistive technology.',
    task: 'Label the top banner, main content, and bottom information in that order.',
    options: ['<footer>', '<main>', '<header>'], answer: ['<header>', '<main>', '<footer>'],
    success: 'Header, main, and footer describe the three page regions.', hint: 'Think top, primary content, then bottom.',
  },
  {
    number: 6, group: 'HTML', kind: 'form', title: 'Connect the form',
    lesson: 'A label connects to an input when its for value matches the input id.',
    task: 'The input is <input id="email" />. Choose the label that focuses it.',
    options: ['<label for="name">Email</label>', '<label for="email">Email</label>', '<label id="email">Email</label>'],
    answer: ['<label for="email">Email</label>'], success: 'The label’s for and the input’s id both say email.', hint: 'Match for="email" to id="email".',
  },
  {
    number: 7, group: 'CSS', kind: 'selector', title: 'Target the card',
    lesson: 'A dot selects a class; a hash selects an id.',
    task: 'The glowing card is <div class="beacon">. Which selector reaches it?',
    options: ['#beacon', '.beacon', 'beacon'], answer: ['.beacon'],
    success: '.beacon selects the element by its class.', hint: 'class uses a dot.',
  },
  {
    number: 8, group: 'CSS', kind: 'float', title: 'Float the rescue crate',
    lesson: 'CSS float moves an element to the left or right side of its container so text can wrap around it.',
    task: 'The rescue note must wrap on the right of the crate. Pick the float value that moves the crate left.',
    options: ['float: left', 'float: right', 'float: none'], answer: ['float: left'],
    success: 'The crate floated left and the note wrapped on its right. The 3D lift is a playful effect; CSS float itself controls horizontal layout.', hint: 'To leave room for text on the right, float the crate left.',
  },
  {
    number: 9, group: 'CSS', kind: 'cascade', title: 'The style duel',
    lesson: 'When two rules target an element, a matching id selector is more specific than a class selector.',
    task: 'A box has class="card" and id="hero". .card { color: blue } and #hero { color: orange }. Which color wins?',
    options: ['blue', 'orange', 'neither'], answer: ['orange'],
    success: 'The id selector #hero wins over .card in this case.', hint: 'The hash selector has higher specificity than the class selector.',
  },
  {
    number: 10, group: 'Flexbox', kind: 'direction', title: 'Choose the axis',
    lesson: 'flex-direction controls the main axis: row runs horizontally, column runs vertically.',
    task: 'Stack the cargo cards from top to bottom.',
    options: ['row', 'column', 'row-reverse'], answer: ['column'],
    success: 'flex-direction: column stacks the cards vertically.', hint: 'Column means top to bottom.',
  },
  {
    number: 11, group: 'Flexbox', kind: 'justify', title: 'Space the satellites',
    lesson: 'justify-content places items along the main axis.',
    task: 'Put one satellite at each end and one in the middle.',
    options: ['flex-start', 'center', 'space-between'], answer: ['space-between'],
    success: 'space-between puts the first and last items at the edges with even space between.', hint: 'Look for space between each item.',
  },
  {
    number: 12, group: 'Flexbox', kind: 'align', title: 'Level the landing pads',
    lesson: 'align-items places items on the cross axis. In a row, that axis is vertical.',
    task: 'Move the three different-height pads so their centers line up.',
    options: ['flex-start', 'center', 'flex-end'], answer: ['center'],
    success: 'align-items: center lines up the pads by their vertical centers.', hint: 'Center the items on the cross axis.',
  },
]

export function isQuestAnswer(level: QuestLevel, picks: string[]) {
  return picks.length === level.answer.length && picks.every((pick, index) => pick === level.answer[index])
}
