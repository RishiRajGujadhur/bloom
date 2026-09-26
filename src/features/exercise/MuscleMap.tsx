import type { Muscle } from './exercises'
import { muscleNames } from './exercises'

/** Front and back body maps; primary muscles glow, secondary tint. */
const front: [Muscle, number, number, number, number][] = [
  ['shoulders', 34, 56, 8, 8],
  ['shoulders', 86, 56, 8, 8],
  ['chest', 48, 64, 12, 9],
  ['chest', 72, 64, 12, 9],
  ['biceps', 30, 82, 6, 12],
  ['biceps', 90, 82, 6, 12],
  ['forearms', 27, 110, 5, 13],
  ['forearms', 93, 110, 5, 13],
  ['abs', 60, 96, 10, 20],
  ['obliques', 46, 100, 5, 13],
  ['obliques', 74, 100, 5, 13],
  ['quads', 50, 152, 9, 26],
  ['quads', 70, 152, 9, 26],
  ['calves', 50, 202, 6, 15],
  ['calves', 70, 202, 6, 15],
]
const back: [Muscle, number, number, number, number][] = [
  ['shoulders', 34, 56, 8, 8],
  ['shoulders', 86, 56, 8, 8],
  ['back', 60, 76, 20, 22],
  ['triceps', 30, 84, 6, 12],
  ['triceps', 90, 84, 6, 12],
  ['forearms', 27, 110, 5, 13],
  ['forearms', 93, 110, 5, 13],
  ['glutes', 50, 124, 11, 10],
  ['glutes', 70, 124, 11, 10],
  ['hamstrings', 50, 160, 9, 24],
  ['hamstrings', 70, 160, 9, 24],
  ['calves', 50, 204, 7, 16],
  ['calves', 70, 204, 7, 16],
]

function Body({
  parts,
  primary,
  secondary,
  label,
  onPick,
}: {
  parts: typeof front
  primary: Muscle[]
  secondary: Muscle[]
  label: string
  onPick?: (m: Muscle) => void
}) {
  return (
    <figure className="mm-body">
      <svg viewBox="0 0 120 230" role="img" aria-label={`${label} view`}>
        <g className="mm-silhouette">
          <circle cx="60" cy="24" r="14" />
          <rect x="36" y="44" width="48" height="84" rx="18" />
          <rect x="20" y="50" width="16" height="78" rx="8" />
          <rect x="84" y="50" width="16" height="78" rx="8" />
          <rect x="40" y="118" width="18" height="104" rx="9" />
          <rect x="62" y="118" width="18" height="104" rx="9" />
        </g>
        {parts.map(([m, cx, cy, rx, ry], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            className="mm-muscle"
            data-level={
              primary.includes(m)
                ? 'primary'
                : secondary.includes(m)
                  ? 'secondary'
                  : 'none'
            }
            onClick={() => onPick?.(m)}
          >
            <title>{muscleNames[m]}</title>
          </ellipse>
        ))}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

export function MuscleMap({
  primary,
  secondary,
  onPick,
}: {
  primary: Muscle[]
  secondary: Muscle[]
  onPick?: (m: Muscle) => void
}) {
  return (
    <div className="mm">
      <Body
        parts={front}
        primary={primary}
        secondary={secondary}
        label="Front"
        onPick={onPick}
      />
      <Body
        parts={back}
        primary={primary}
        secondary={secondary}
        label="Back"
        onPick={onPick}
      />
    </div>
  )
}
