export type CodePath = {
  id: string
  name: string
  color: string
  source: string
  chapters: { id: string; title: string; practice: string; project: string }[]
}

export const codePaths: CodePath[] = [
  { id: 'frontend', name: 'Web foundations', color: '#f2a65a', source: 'https://roadmap.sh/frontend', chapters: [
    { id: 'html', title: 'HTML landmarks', practice: 'Build a page with a header, main region, and labeled form.', project: 'Personal profile page' },
    { id: 'css', title: 'CSS and layouts', practice: 'Style the page with selectors, Flexbox, and a phone layout.', project: 'Responsive profile' },
    { id: 'javascript', title: 'JavaScript foundations', practice: 'Use variables, functions, arrays, and events to make the page respond.', project: 'Interactive task list' },
    { id: 'accessibility', title: 'Accessible interfaces', practice: 'Add labels, focus styles, keyboard access, and motion preferences.', project: 'Keyboard-friendly task list' },
    { id: 'api', title: 'APIs and async code', practice: 'Fetch remote data, handle loading, and show an error state.', project: 'Weather dashboard' },
    { id: 'ship', title: 'Test and ship', practice: 'Test the main interactions, inspect phone layouts, and measure loading.', project: 'Published portfolio' },
  ] },
  { id: 'react', name: 'React apps', color: '#64b9d8', source: 'https://roadmap.sh/react', chapters: [
    { id: 'components', title: 'Components and JSX', practice: 'Split one interface into reusable components and pass props.', project: 'Recipe cards' },
    { id: 'state', title: 'State and events', practice: 'Use state to update a list without editing the DOM directly.', project: 'Habit tracker' },
    { id: 'effects', title: 'Effects and data', practice: 'Load data and clean up a subscription or timer.', project: 'Live search app' },
    { id: 'routing', title: 'Routes and forms', practice: 'Connect multiple screens and validate a form.', project: 'Recipe notebook' },
    { id: 'testing', title: 'Component tests', practice: 'Test keyboard actions, empty states, and a failed request.', project: 'Tested recipe notebook' },
    { id: 'production', title: 'Production project', practice: 'Profile renders, split heavy code, and publish the result.', project: 'Full React web app' },
  ] },
  { id: 'python', name: 'Python builder', color: '#83b879', source: 'https://roadmap.sh/python', chapters: [
    { id: 'syntax', title: 'Values and flow', practice: 'Use strings, numbers, conditions, and loops.', project: 'Text adventure' },
    { id: 'functions', title: 'Functions and collections', practice: 'Model data with lists and dictionaries; write reusable functions.', project: 'Quiz game' },
    { id: 'files', title: 'Files and errors', practice: 'Read and write files while handling missing or malformed data.', project: 'Expense tracker CLI' },
    { id: 'testing', title: 'Modules and tests', practice: 'Split the program into modules and cover edge cases with tests.', project: 'Tested expense tracker' },
    { id: 'api', title: 'APIs and automation', practice: 'Call an API, validate responses, and automate a repeated task.', project: 'Data collector' },
    { id: 'backend', title: 'Backend project', practice: 'Design routes, persistence, validation, and deployment.', project: 'Python web service' },
  ] },
  { id: 'algorithms', name: 'Problem solving', color: '#c492dc', source: 'https://roadmap.sh/datastructures-and-algorithms', chapters: [
    { id: 'arrays', title: 'Arrays and strings', practice: 'Solve a small kata, then compare two solutions.', project: 'String utility kit' },
    { id: 'maps', title: 'Maps and sets', practice: 'Count, group, and look up values without nested loops.', project: 'Word frequency tool' },
    { id: 'recursion', title: 'Recursion', practice: 'Trace a recursive function and identify its stopping case.', project: 'Folder tree explorer' },
    { id: 'sorting', title: 'Sorting and search', practice: 'Implement binary search and explain when it applies.', project: 'Fast catalog search' },
    { id: 'trees', title: 'Trees and graphs', practice: 'Traverse connected nodes and avoid revisiting them.', project: 'Route finder' },
    { id: 'design', title: 'Advanced kata', practice: 'Compare time and space costs, then refactor a working solution.', project: 'Challenge portfolio' },
  ] },
]

export function nextChapter(path: CodePath, completed: Record<string, boolean>) {
  return path.chapters.find((chapter) => !completed[`${path.id}:${chapter.id}`]) ?? null
}

export function toggleChapter(path: CodePath, completed: Record<string, boolean>, index: number) {
  const updated = { ...completed }
  const key = `${path.id}:${path.chapters[index].id}`
  if (updated[key]) path.chapters.slice(index).forEach((chapter) => { delete updated[`${path.id}:${chapter.id}`] })
  else updated[key] = true
  return updated
}
