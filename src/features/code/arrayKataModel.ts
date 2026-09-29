import type { Check } from './codeCourse'

export type ArrayKata = { id: string; title: string; objective: string; starter: string; solution: string; hint: string; checks: Check[]; input: string; output: string }

export const ARRAY_KATA: ArrayKata[] = [
  {
    id: 'double', title: 'Double the harvest', objective: 'Write doubleHarvest(values) that returns a new array with every number doubled. Leave the input array unchanged.',
    starter: 'function doubleHarvest(values) {\n  // Return a new array\n}\n', solution: 'function doubleHarvest(values) {\n  return values.map((value) => value * 2)\n}', hint: 'map returns a new array by applying a function to each item.',
    checks: [{ label: 'Doubles positive values', probe: 'doubleHarvest([2, 4, 6])', equals: [4, 8, 12] }, { label: 'Handles zero and negatives', probe: 'doubleHarvest([-3, 0])', equals: [-6, 0] }, { label: 'Handles an empty array', probe: 'doubleHarvest([])', equals: [] }, { label: 'Does not mutate the input', probe: '(() => { const values = [2, 4]; doubleHarvest(values); return values })()', equals: [2, 4] }], input: '[2, 4, 6]', output: '[4, 8, 12]',
  },
  {
    id: 'long', title: 'Keep long names', objective: 'Write keepLong(names) that keeps names with at least five letters, in their original order.',
    starter: 'function keepLong(names) {\n  // Keep names with length >= 5\n}\n', solution: 'function keepLong(names) {\n  return names.filter((name) => name.length >= 5)\n}', hint: 'filter keeps items for which its callback returns true.',
    checks: [{ label: 'Keeps only long names', probe: "keepLong(['Mira', 'Clover', 'Fern', 'Tulip'])", equals: ['Clover', 'Tulip'] }, { label: 'Boundary of five letters', probe: "keepLong(['Basil', 'Rose'])", equals: ['Basil'] }, { label: 'No matches returns empty', probe: "keepLong(['Ivy', 'Ash'])", equals: [] }], input: "['Mira', 'Clover', 'Tulip']", output: "['Clover', 'Tulip']",
  },
  {
    id: 'total', title: 'Total the scores', objective: 'Write totalScores(points) that adds every number. An empty array should return 0.',
    starter: 'function totalScores(points) {\n  // Add the values\n}\n', solution: 'function totalScores(points) {\n  return points.reduce((sum, value) => sum + value, 0)\n}', hint: 'reduce can carry a running sum. Start that sum at 0.',
    checks: [{ label: 'Adds several scores', probe: 'totalScores([3, 5, 7])', equals: 15 }, { label: 'Handles an empty array', probe: 'totalScores([])', equals: 0 }, { label: 'Handles negative values', probe: 'totalScores([5, -2, 1])', equals: 4 }], input: '[3, 5, 7]', output: '15',
  },
]
