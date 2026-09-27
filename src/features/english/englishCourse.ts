/**
 * Bloom English course content. The shape follows LibreLingo's idea of a
 * course graph (units → skills → words & phrases); the content is our own.
 */
export type Word = { en: string; emoji: string; meaning: string; example: string }
export type Phrase = { en: string; meaning: string }
export type Grammar = { id: string; title: string; rule: string; examples: string[]; cloze: { text: string; answer: string; options: string[] }[] }
export type Unit = { id: string; level: 'A1' | 'A2' | 'B1' | 'B2'; title: string; emoji: string; color: string; words: Word[]; phrases: Phrase[]; grammar: Grammar }

export const units: Unit[] = [
  {
    id: 'hello', level: 'A1', title: 'Hello!', emoji: '👋', color: '#58cc02',
    words: [
      { en: 'hello', emoji: '👋', meaning: 'a greeting', example: 'Hello, I am Sam.' },
      { en: 'goodbye', emoji: '🙋', meaning: 'said when leaving', example: 'Goodbye, see you soon.' },
      { en: 'please', emoji: '🙏', meaning: 'a polite request word', example: 'Water, please.' },
      { en: 'thank you', emoji: '💐', meaning: 'words of gratitude', example: 'Thank you for the tea.' },
      { en: 'yes', emoji: '✅', meaning: 'agreement', example: 'Yes, I am ready.' },
      { en: 'no', emoji: '❌', meaning: 'disagreement', example: 'No, thank you.' },
      { en: 'friend', emoji: '🤝', meaning: 'a person you like and trust', example: 'She is my friend.' },
      { en: 'name', emoji: '📛', meaning: 'what someone is called', example: 'My name is Ana.' },
    ],
    phrases: [
      { en: 'Nice to meet you', meaning: 'said when you meet someone new' },
      { en: 'How are you', meaning: 'asking about someone’s day' },
      { en: 'My name is Ana', meaning: 'introducing yourself' },
      { en: 'I am fine thank you', meaning: 'answering how are you' },
    ],
    grammar: {
      id: 'to-be', title: 'The verb “to be”', rule: 'I am · you are · he/she/it is · we/they are. Use it for names, feelings and descriptions.',
      examples: ['I am happy.', 'You are kind.', 'She is a teacher.'],
      cloze: [
        { text: 'I ___ ready.', answer: 'am', options: ['am', 'is', 'are'] },
        { text: 'They ___ my friends.', answer: 'are', options: ['is', 'are', 'am'] },
        { text: 'He ___ tired.', answer: 'is', options: ['are', 'am', 'is'] },
      ],
    },
  },
  {
    id: 'food', level: 'A1', title: 'Food & drink', emoji: '🍎', color: '#ff9600',
    words: [
      { en: 'apple', emoji: '🍎', meaning: 'a round fruit', example: 'I eat an apple.' },
      { en: 'bread', emoji: '🍞', meaning: 'baked from flour', example: 'The bread is warm.' },
      { en: 'water', emoji: '💧', meaning: 'a clear drink', example: 'I drink water.' },
      { en: 'coffee', emoji: '☕', meaning: 'a hot brown drink', example: 'Coffee, please.' },
      { en: 'rice', emoji: '🍚', meaning: 'small white grains', example: 'We cook rice.' },
      { en: 'egg', emoji: '🥚', meaning: 'laid by a hen', example: 'An egg for breakfast.' },
      { en: 'cheese', emoji: '🧀', meaning: 'made from milk', example: 'I like cheese.' },
      { en: 'soup', emoji: '🍲', meaning: 'a hot liquid meal', example: 'The soup is hot.' },
    ],
    phrases: [
      { en: 'I would like a coffee', meaning: 'ordering politely' },
      { en: 'The bill please', meaning: 'asking to pay' },
      { en: 'I am hungry', meaning: 'you want to eat' },
      { en: 'This soup is delicious', meaning: 'praising food' },
    ],
    grammar: {
      id: 'a-an', title: 'A or an', rule: 'Use “an” before a vowel sound (an apple, an hour) and “a” before a consonant sound (a banana, a university).',
      examples: ['an egg', 'a coffee', 'an hour'],
      cloze: [
        { text: 'I eat ___ apple.', answer: 'an', options: ['a', 'an'] },
        { text: 'She wants ___ sandwich.', answer: 'a', options: ['a', 'an'] },
        { text: 'Wait ___ hour.', answer: 'an', options: ['a', 'an'] },
      ],
    },
  },
  {
    id: 'home', level: 'A1', title: 'At home', emoji: '🏠', color: '#1cb0f6',
    words: [
      { en: 'house', emoji: '🏠', meaning: 'a building people live in', example: 'My house is small.' },
      { en: 'bed', emoji: '🛏️', meaning: 'you sleep in it', example: 'The bed is soft.' },
      { en: 'door', emoji: '🚪', meaning: 'you open it to go in', example: 'Close the door.' },
      { en: 'window', emoji: '🪟', meaning: 'glass in a wall', example: 'Open the window.' },
      { en: 'chair', emoji: '🪑', meaning: 'you sit on it', example: 'Sit on the chair.' },
      { en: 'cat', emoji: '🐈', meaning: 'a small pet that purrs', example: 'The cat sleeps.' },
      { en: 'dog', emoji: '🐕', meaning: 'a pet that barks', example: 'The dog runs.' },
      { en: 'key', emoji: '🔑', meaning: 'opens a lock', example: 'Where is my key?' },
    ],
    phrases: [
      { en: 'Where is the kitchen', meaning: 'asking for a room' },
      { en: 'The cat is on the bed', meaning: 'describing where' },
      { en: 'Please close the door', meaning: 'a polite request' },
      { en: 'I live in a small house', meaning: 'describing your home' },
    ],
    grammar: {
      id: 'prepositions', title: 'In, on, under', rule: '“In” is inside, “on” is touching the top, “under” is below.',
      examples: ['The key is in the bag.', 'The cat is on the bed.', 'The dog is under the table.'],
      cloze: [
        { text: 'The book is ___ the table.', answer: 'on', options: ['on', 'in', 'under'] },
        { text: 'The milk is ___ the fridge.', answer: 'in', options: ['on', 'in', 'under'] },
        { text: 'The shoes are ___ the bed.', answer: 'under', options: ['on', 'under', 'in'] },
      ],
    },
  },
  {
    id: 'daily', level: 'A2', title: 'Daily routine', emoji: '⏰', color: '#ce82ff',
    words: [
      { en: 'wake up', emoji: '⏰', meaning: 'stop sleeping', example: 'I wake up at seven.' },
      { en: 'breakfast', emoji: '🥞', meaning: 'the morning meal', example: 'Breakfast is ready.' },
      { en: 'work', emoji: '💼', meaning: 'your job', example: 'I go to work by bus.' },
      { en: 'walk', emoji: '🚶', meaning: 'move on foot', example: 'We walk in the park.' },
      { en: 'read', emoji: '📖', meaning: 'look at words', example: 'I read before bed.' },
      { en: 'sleep', emoji: '😴', meaning: 'rest with eyes closed', example: 'I sleep eight hours.' },
      { en: 'shower', emoji: '🚿', meaning: 'wash under water', example: 'I take a shower.' },
      { en: 'always', emoji: '♾️', meaning: 'every time', example: 'I always drink tea.' },
    ],
    phrases: [
      { en: 'I usually wake up early', meaning: 'a habit' },
      { en: 'She goes to work by train', meaning: 'how she travels' },
      { en: 'We have dinner at eight', meaning: 'meal time' },
      { en: 'He never drinks coffee', meaning: 'something he does not do' },
    ],
    grammar: {
      id: 'present-simple', title: 'Present simple', rule: 'For habits. Add -s for he/she/it: I walk → she walks. Use do/does for questions.',
      examples: ['She reads every day.', 'Do you walk to work?', 'He does not sleep late.'],
      cloze: [
        { text: 'She ___ to work.', answer: 'walks', options: ['walk', 'walks', 'walking'] },
        { text: '___ you like tea?', answer: 'Do', options: ['Do', 'Does', 'Is'] },
        { text: 'He ___ coffee every morning.', answer: 'drinks', options: ['drink', 'drinks', 'drunk'] },
      ],
    },
  },
  {
    id: 'travel', level: 'A2', title: 'Travel', emoji: '✈️', color: '#ff4b4b',
    words: [
      { en: 'airport', emoji: '🛫', meaning: 'where planes land', example: 'The airport is busy.' },
      { en: 'ticket', emoji: '🎫', meaning: 'lets you travel', example: 'One ticket, please.' },
      { en: 'hotel', emoji: '🏨', meaning: 'you pay to sleep there', example: 'Our hotel is near the sea.' },
      { en: 'map', emoji: '🗺️', meaning: 'a drawing of places', example: 'Look at the map.' },
      { en: 'train', emoji: '🚆', meaning: 'runs on rails', example: 'The train is late.' },
      { en: 'passport', emoji: '🛂', meaning: 'shows your nationality', example: 'Show your passport.' },
      { en: 'beach', emoji: '🏖️', meaning: 'sand by the sea', example: 'We swim at the beach.' },
      { en: 'left', emoji: '⬅️', meaning: 'opposite of right', example: 'Turn left here.' },
    ],
    phrases: [
      { en: 'Where is the train station', meaning: 'asking the way' },
      { en: 'I have a reservation', meaning: 'at a hotel' },
      { en: 'How much is a ticket', meaning: 'asking the price' },
      { en: 'Turn left at the bank', meaning: 'giving directions' },
    ],
    grammar: {
      id: 'past-simple', title: 'Past simple', rule: 'Finished actions. Regular verbs add -ed (walk → walked). Many are irregular: go → went, see → saw, eat → ate.',
      examples: ['We visited Paris.', 'I went to the beach.', 'She saw the sea.'],
      cloze: [
        { text: 'Yesterday I ___ to the airport.', answer: 'went', options: ['go', 'went', 'gone'] },
        { text: 'We ___ a great hotel.', answer: 'found', options: ['find', 'found', 'finded'] },
        { text: 'They ___ the museum.', answer: 'visited', options: ['visit', 'visited', 'visiting'] },
      ],
    },
  },
  {
    id: 'feelings', level: 'B1', title: 'Feelings & wellbeing', emoji: '🌿', color: '#2ec4b6',
    words: [
      { en: 'calm', emoji: '😌', meaning: 'peaceful, not worried', example: 'Breathing makes me calm.' },
      { en: 'anxious', emoji: '😟', meaning: 'worried and uneasy', example: 'I feel anxious before exams.' },
      { en: 'grateful', emoji: '🙏', meaning: 'thankful', example: 'I am grateful for my family.' },
      { en: 'proud', emoji: '🏅', meaning: 'pleased with an achievement', example: 'She is proud of her work.' },
      { en: 'exhausted', emoji: '🥱', meaning: 'very tired', example: 'After the run I was exhausted.' },
      { en: 'focus', emoji: '🎯', meaning: 'give full attention', example: 'I need to focus.' },
      { en: 'habit', emoji: '🔁', meaning: 'something you do regularly', example: 'Reading is a good habit.' },
      { en: 'breathe', emoji: '🌬️', meaning: 'take air in and out', example: 'Breathe slowly.' },
    ],
    phrases: [
      { en: 'I have been feeling stressed lately', meaning: 'describing a recent state' },
      { en: 'It helps me to take a walk', meaning: 'a coping strategy' },
      { en: 'I am grateful for small things', meaning: 'gratitude' },
      { en: 'Let us take a deep breath', meaning: 'calming down together' },
    ],
    grammar: {
      id: 'present-perfect', title: 'Present perfect', rule: 'have/has + past participle for experiences and things that started in the past and continue: I have lived here for two years.',
      examples: ['I have tried yoga.', 'She has felt calmer since June.', 'Have you ever meditated?'],
      cloze: [
        { text: 'I ___ never been to Japan.', answer: 'have', options: ['have', 'has', 'am'] },
        { text: 'She has ___ here since 2020.', answer: 'lived', options: ['live', 'lived', 'living'] },
        { text: '___ you ever tried sushi?', answer: 'Have', options: ['Did', 'Have', 'Do'] },
      ],
    },
  },
  {
    id: 'work', level: 'B1', title: 'Work & study', emoji: '💼', color: '#8f7ae5',
    words: [
      { en: 'meeting', emoji: '🗓️', meaning: 'people talk together at work', example: 'The meeting starts at ten.' },
      { en: 'deadline', emoji: '⏳', meaning: 'the time something must be done', example: 'The deadline is Friday.' },
      { en: 'colleague', emoji: '🧑‍💼', meaning: 'a person you work with', example: 'My colleague helped me.' },
      { en: 'interview', emoji: '🎤', meaning: 'a formal talk for a job', example: 'I have an interview today.' },
      { en: 'skill', emoji: '🛠️', meaning: 'something you do well', example: 'Writing is a useful skill.' },
      { en: 'improve', emoji: '📈', meaning: 'get better', example: 'I want to improve my English.' },
      { en: 'schedule', emoji: '📅', meaning: 'a plan of times', example: 'Check your schedule.' },
      { en: 'goal', emoji: '🎯', meaning: 'something you aim for', example: 'My goal is fluency.' },
    ],
    phrases: [
      { en: 'Could you send me the report', meaning: 'a polite request at work' },
      { en: 'I will finish it by Friday', meaning: 'a promise about a deadline' },
      { en: 'Tell me about yourself', meaning: 'a common interview question' },
      { en: 'I am good at solving problems', meaning: 'describing a strength' },
    ],
    grammar: {
      id: 'future', title: 'Will vs going to', rule: '“Going to” for plans already decided; “will” for quick decisions, promises and predictions.',
      examples: ['I am going to study tonight.', 'I will help you.', 'It will rain tomorrow.'],
      cloze: [
        { text: 'Look at the clouds, it ___ rain.', answer: 'is going to', options: ['is going to', 'will to', 'goes'] },
        { text: 'The phone is ringing. I ___ answer it.', answer: 'will', options: ['will', 'am going', 'going'] },
        { text: 'We ___ visit Rome next summer.', answer: 'are going to', options: ['are going to', 'will to', 'go to'] },
      ],
    },
  },
  {
    id: 'ideas', level: 'B2', title: 'Opinions & ideas', emoji: '💡', color: '#ffc800',
    words: [
      { en: 'although', emoji: '↔️', meaning: 'despite the fact that', example: 'Although it rained, we walked.' },
      { en: 'argue', emoji: '🗣️', meaning: 'give reasons for a view', example: 'I would argue it is fair.' },
      { en: 'evidence', emoji: '🔍', meaning: 'facts that show something is true', example: 'There is little evidence.' },
      { en: 'benefit', emoji: '➕', meaning: 'a good result', example: 'Exercise has many benefits.' },
      { en: 'drawback', emoji: '➖', meaning: 'a disadvantage', example: 'The main drawback is cost.' },
      { en: 'sustainable', emoji: '♻️', meaning: 'can continue without harm', example: 'Sustainable habits last.' },
      { en: 'convince', emoji: '🤔', meaning: 'make someone believe', example: 'You convinced me.' },
      { en: 'nevertheless', emoji: '🔄', meaning: 'even so', example: 'It was hard; nevertheless, we finished.' },
    ],
    phrases: [
      { en: 'In my opinion it is worth it', meaning: 'giving a view' },
      { en: 'On the other hand it is expensive', meaning: 'contrasting' },
      { en: 'I see your point but', meaning: 'polite disagreement' },
      { en: 'The evidence suggests otherwise', meaning: 'using facts' },
    ],
    grammar: {
      id: 'conditionals', title: 'Conditionals', rule: 'First: if + present, will (real future). Second: if + past, would (imaginary). If I had time, I would travel.',
      examples: ['If it rains, we will stay in.', 'If I were you, I would rest.', 'If she studied, she would pass.'],
      cloze: [
        { text: 'If I ___ rich, I would travel.', answer: 'were', options: ['am', 'were', 'will be'] },
        { text: 'If it rains, we ___ stay home.', answer: 'will', options: ['would', 'will', 'are'] },
        { text: 'She would help if she ___ time.', answer: 'had', options: ['has', 'had', 'will have'] },
      ],
    },
  },
]

export const allWords = units.flatMap((u) => u.words.map((w) => ({ ...w, unit: u.id })))

export type Story = { id: string; title: string; emoji: string; level: string; lines: { who: string; text: string }[]; questions: { q: string; answer: string; options: string[] }[] }
export const stories: Story[] = [
  {
    id: 'cafe', title: 'At the café', emoji: '☕', level: 'A1',
    lines: [
      { who: 'Barista', text: 'Hello! What would you like?' },
      { who: 'Mia', text: 'Hi. I would like a coffee, please.' },
      { who: 'Barista', text: 'Hot or iced?' },
      { who: 'Mia', text: 'Hot, please. And a piece of cake.' },
      { who: 'Barista', text: 'That is five pounds.' },
      { who: 'Mia', text: 'Here you are. Thank you!' },
    ],
    questions: [
      { q: 'What does Mia drink?', answer: 'Hot coffee', options: ['Hot coffee', 'Iced tea', 'Water'] },
      { q: 'How much does it cost?', answer: 'Five pounds', options: ['Two pounds', 'Five pounds', 'Ten pounds'] },
    ],
  },
  {
    id: 'lost', title: 'Lost in the city', emoji: '🗺️', level: 'A2',
    lines: [
      { who: 'Leo', text: 'Excuse me, where is the train station?' },
      { who: 'Woman', text: 'Go straight and turn left at the bank.' },
      { who: 'Leo', text: 'Is it far?' },
      { who: 'Woman', text: 'No, it is about five minutes on foot.' },
      { who: 'Leo', text: 'Great, thank you so much.' },
    ],
    questions: [
      { q: 'Where does Leo want to go?', answer: 'The train station', options: ['The bank', 'The train station', 'The hotel'] },
      { q: 'Where should he turn left?', answer: 'At the bank', options: ['At the park', 'At the bank', 'At the café'] },
    ],
  },
  {
    id: 'interview', title: 'The interview', emoji: '🎤', level: 'B1',
    lines: [
      { who: 'Manager', text: 'Tell me about yourself.' },
      { who: 'Ravi', text: 'I have worked in design for three years, and I love solving problems.' },
      { who: 'Manager', text: 'What is your biggest strength?' },
      { who: 'Ravi', text: 'I am calm under pressure, so I always meet deadlines.' },
      { who: 'Manager', text: 'Why do you want this job?' },
      { who: 'Ravi', text: 'I want to improve my skills in a creative team.' },
    ],
    questions: [
      { q: 'How long has Ravi worked in design?', answer: 'Three years', options: ['One year', 'Three years', 'Ten years'] },
      { q: 'What is his strength?', answer: 'Staying calm under pressure', options: ['Speaking French', 'Staying calm under pressure', 'Drawing fast'] },
    ],
  },
]

export type Roleplay = { id: string; title: string; emoji: string; steps: { bot: string; keywords: string[]; hint: string }[] }
export const roleplays: Roleplay[] = [
  {
    id: 'order', title: 'Order at a café', emoji: '☕',
    steps: [
      { bot: 'Hi there! What can I get you?', keywords: ['like', 'coffee', 'tea', 'please', 'want', 'have'], hint: 'I would like a tea, please.' },
      { bot: 'Sure. Anything to eat?', keywords: ['yes', 'no', 'cake', 'sandwich', 'thanks', 'please'], hint: 'Yes, a sandwich, please.' },
      { bot: 'For here or to go?', keywords: ['here', 'go', 'take'], hint: 'For here, please.' },
    ],
  },
  {
    id: 'doctor', title: 'At the doctor', emoji: '🩺',
    steps: [
      { bot: 'Good morning. What seems to be the problem?', keywords: ['head', 'hurt', 'pain', 'feel', 'sick', 'cough', 'ache'], hint: 'I have a headache and I feel tired.' },
      { bot: 'How long have you felt like this?', keywords: ['day', 'days', 'week', 'since', 'yesterday', 'for'], hint: 'For two days.' },
      { bot: 'Are you sleeping well?', keywords: ['yes', 'no', 'sleep', 'hours', 'badly', 'well'], hint: 'No, I only sleep five hours.' },
    ],
  },
  {
    id: 'job', title: 'Job interview', emoji: '💼',
    steps: [
      { bot: 'Thanks for coming. Tell me about yourself.', keywords: ['i', 'work', 'years', 'am', 'study', 'experience'], hint: 'I am a nurse and I have worked for five years.' },
      { bot: 'What are you good at?', keywords: ['good', 'at', 'skill', 'team', 'organised', 'problems'], hint: 'I am good at working in a team.' },
      { bot: 'Where do you see yourself in five years?', keywords: ['will', 'want', 'hope', 'lead', 'grow', 'learn'], hint: 'I hope I will lead a small team.' },
    ],
  },
]

export const minimalPairs: [string, string][] = [
  ['ship', 'sheep'], ['bit', 'beat'], ['full', 'fool'], ['cat', 'cut'], ['bad', 'bed'], ['light', 'right'], ['van', 'fan'], ['think', 'sink'], ['walk', 'work'], ['pen', 'pan'],
]
export const spellingWords = ['necessary', 'beautiful', 'calendar', 'rhythm', 'separate', 'definitely', 'restaurant', 'Wednesday', 'library', 'environment', 'tomorrow', 'receive']

export const leagues = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond']
export const leagueColors = ['#cd7f32', '#b8c2cc', '#ffc800', '#1c6cf6', '#e0115f', '#2ec4b6', '#9b59b6', '#f0e6d2', '#3a3a4a', '#8fe3ff']
export const rivalNames = ['Aiko', 'Ben', 'Carla', 'Dev', 'Emma', 'Farid', 'Grace', 'Hugo', 'Ines', 'Jon', 'Kemi', 'Luca', 'Maya', 'Noor', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sven']
