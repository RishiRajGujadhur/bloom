# Shared feature styles

`src/styles/common.css` is imported once by `src/index.css`. Reuse these classes
in feature JSX instead of copying layout declarations into feature stylesheets.
Keep a feature class alongside the shared class for local appearance and media
queries.

| Class | Layout |
| --- | --- |
| `bloom-wrap` | Wrapping flex row |
| `bloom-controls` | Wrapping flex row with centered controls |
| `bloom-inline` | Centered flex row without wrapping |
| `bloom-stack` | Grid stack |
| `bloom-start-stack` | Grid stack aligned to the start |
| `bloom-list` | Grid list with bullets, margins and padding removed |
| `bloom-columns` | Two equal grid columns |
| `bloom-surface` | Themed panel border, background, padding and radius |

```tsx
<div className="practice-actions bloom-controls">...</div>
<div className="practice-layout bloom-columns">...</div>
```

```css
.practice-actions { --bloom-gap: 12px; }
@media (max-width: 700px) {
  .practice-layout { grid-template-columns: 1fr; }
}
```

Rows, stacks and lists default to an 8px gap; start stacks use 14px and columns
use 1rem. Override `--bloom-gap` in the feature class. Surface padding and radius
default to 1rem and can be changed with `--bloom-padding` and `--bloom-radius`.
Defaults are set on each shared class so nested layouts do not inherit a
parent's spacing. Keep feature styles after the common stylesheet in the
cascade. Do not assign two conflicting layout classes to the same element.

## Learning activities

`src/features/code/LearningExercise.tsx` provides the common section, heading,
description and accessible back button used by 30 activities. It accepts native
section attributes, `title`, `description`, `onClose` and children. The activity
continues to own its state, persistence, validation, previews and controls.

```tsx
<LearningExercise
  className="practice"
  aria-label="Practice activity"
  title="Practice a skill"
  description="Change the example, then check your work."
  onClose={onClose}
>
  {/* Activity controls and feedback */}
</LearningExercise>
```

The circular back button has fixed dimensions by default. `backSizing="minimum"`
allows it to grow with its content; `backSizing="feature"` uses the activity's
existing button styles. Feature CSS owns accent colors, focus indicators,
special typography and responsive breakpoints. CSS Modules keep their own
scoped styles; these shared classes are plain global classes.
