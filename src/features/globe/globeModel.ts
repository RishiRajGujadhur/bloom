import seedrandom from 'seedrandom'

/**
 * Globe Quiz data: the countries used in quizzes, keyed by their name in the
 * world-atlas dataset, with a friendly display name, capital and continent.
 */
export type Country = { atlas: string; name: string; capital: string; continent: string }
export const countries: Country[] = [
  ['Canada', 'Canada', 'Ottawa', 'North America'], ['United States of America', 'United States', 'Washington, D.C.', 'North America'],
  ['Mexico', 'Mexico', 'Mexico City', 'North America'], ['Cuba', 'Cuba', 'Havana', 'North America'], ['Jamaica', 'Jamaica', 'Kingston', 'North America'],
  ['Brazil', 'Brazil', 'Brasília', 'South America'], ['Argentina', 'Argentina', 'Buenos Aires', 'South America'], ['Chile', 'Chile', 'Santiago', 'South America'],
  ['Peru', 'Peru', 'Lima', 'South America'], ['Colombia', 'Colombia', 'Bogotá', 'South America'], ['Venezuela', 'Venezuela', 'Caracas', 'South America'],
  ['Bolivia', 'Bolivia', 'Sucre', 'South America'], ['Ecuador', 'Ecuador', 'Quito', 'South America'], ['Uruguay', 'Uruguay', 'Montevideo', 'South America'],
  ['United Kingdom', 'United Kingdom', 'London', 'Europe'], ['France', 'France', 'Paris', 'Europe'], ['Germany', 'Germany', 'Berlin', 'Europe'],
  ['Spain', 'Spain', 'Madrid', 'Europe'], ['Portugal', 'Portugal', 'Lisbon', 'Europe'], ['Italy', 'Italy', 'Rome', 'Europe'], ['Greece', 'Greece', 'Athens', 'Europe'],
  ['Norway', 'Norway', 'Oslo', 'Europe'], ['Sweden', 'Sweden', 'Stockholm', 'Europe'], ['Finland', 'Finland', 'Helsinki', 'Europe'], ['Poland', 'Poland', 'Warsaw', 'Europe'],
  ['Ukraine', 'Ukraine', 'Kyiv', 'Europe'], ['Ireland', 'Ireland', 'Dublin', 'Europe'], ['Netherlands', 'Netherlands', 'Amsterdam', 'Europe'], ['Switzerland', 'Switzerland', 'Bern', 'Europe'],
  ['Austria', 'Austria', 'Vienna', 'Europe'], ['Iceland', 'Iceland', 'Reykjavík', 'Europe'], ['Romania', 'Romania', 'Bucharest', 'Europe'], ['Czechia', 'Czechia', 'Prague', 'Europe'],
  ['Russia', 'Russia', 'Moscow', 'Europe/Asia'], ['Turkey', 'Türkiye', 'Ankara', 'Europe/Asia'],
  ['China', 'China', 'Beijing', 'Asia'], ['Japan', 'Japan', 'Tokyo', 'Asia'], ['India', 'India', 'New Delhi', 'Asia'], ['South Korea', 'South Korea', 'Seoul', 'Asia'],
  ['Indonesia', 'Indonesia', 'Jakarta', 'Asia'], ['Thailand', 'Thailand', 'Bangkok', 'Asia'], ['Vietnam', 'Vietnam', 'Hanoi', 'Asia'], ['Philippines', 'Philippines', 'Manila', 'Asia'],
  ['Pakistan', 'Pakistan', 'Islamabad', 'Asia'], ['Iran', 'Iran', 'Tehran', 'Asia'], ['Saudi Arabia', 'Saudi Arabia', 'Riyadh', 'Asia'], ['Mongolia', 'Mongolia', 'Ulaanbaatar', 'Asia'],
  ['Nepal', 'Nepal', 'Kathmandu', 'Asia'], ['Kazakhstan', 'Kazakhstan', 'Astana', 'Asia'], ['Israel', 'Israel', 'Jerusalem', 'Asia'],
  ['Egypt', 'Egypt', 'Cairo', 'Africa'], ['Nigeria', 'Nigeria', 'Abuja', 'Africa'], ['Kenya', 'Kenya', 'Nairobi', 'Africa'], ['South Africa', 'South Africa', 'Pretoria', 'Africa'],
  ['Ethiopia', 'Ethiopia', 'Addis Ababa', 'Africa'], ['Morocco', 'Morocco', 'Rabat', 'Africa'], ['Ghana', 'Ghana', 'Accra', 'Africa'], ['Madagascar', 'Madagascar', 'Antananarivo', 'Africa'],
  ['Algeria', 'Algeria', 'Algiers', 'Africa'], ['Tanzania', 'Tanzania', 'Dodoma', 'Africa'], ['Dem. Rep. Congo', 'DR Congo', 'Kinshasa', 'Africa'],
  ['Australia', 'Australia', 'Canberra', 'Oceania'], ['New Zealand', 'New Zealand', 'Wellington', 'Oceania'], ['Papua New Guinea', 'Papua New Guinea', 'Port Moresby', 'Oceania'],
].map(([atlas, name, capital, continent]) => ({ atlas, name, capital, continent }))

export const continents = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']

export type Mode = 'find' | 'name' | 'capital'
export type Question = { mode: Mode; country: Country; options?: string[] }
export function question(mode: Mode, continent: string, seed = String(Date.now())): Question {
  const rng = seedrandom(seed)
  const pool = countries.filter((c) => continent === 'All' || c.continent.includes(continent))
  const country = pool[Math.floor(rng() * pool.length)]
  if (mode !== 'capital') return { mode, country }
  const others = countries.filter((c) => c !== country).sort(() => rng() - 0.5).slice(0, 3).map((c) => c.capital)
  return { mode, country, options: [country.capital, ...others].sort(() => rng() - 0.5) }
}
