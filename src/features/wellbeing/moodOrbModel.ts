/** Orb slider (0 = anxious … 1 = calm) to the 1–5 mood scale. */
export const orbToMood = (value: number) => Math.min(5, Math.max(1, Math.round(1 + value * 4)))
export const orbLabel = (value: number) =>
  value < 0.2 ? 'Anxious' : value < 0.4 ? 'Uneasy' : value < 0.6 ? 'Okay' : value < 0.8 ? 'Settled' : 'Calm'
