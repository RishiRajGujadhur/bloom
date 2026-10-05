# Bloom chatbot quality of life improvements

Target: 150 individually committed and pushed improvements.
Existing appearance changes were tested and pushed first in `1fdbb76`.
Each numbered entry describes a user-facing change, with validation recorded alongside it.
Suggested features are applied where they fit Bloom's local guide and planner; no fabricated AI confidence or source claims.

## Completed

- [x] 001 — Three-choice slider for guide suggestions and page search, with a native range control and no hidden focusable action buttons. Validation: slider component and guide tests.
- [x] 002 — Use the same three-choice slider for planner quick replies. Validation: TypeScript project check and diff check.
- [x] 003 — Announce suggestion positions with meaningful slider values. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 004 — Announce the visible suggestion range after paging. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 005 — Keep slider position text clear for keyboard and touch users. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 006 — Guard guide actions against repeated clicks while replying. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 007 — Ignore blank or duplicate guide submissions while replying. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 008 — Preserve IME composition when submitting guide messages. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 009 — Bound guide input length to prevent accidental huge commands. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 010 — Show a send key hint on the mobile guide keyboard. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 011 — Remove browser autocomplete clutter from guide commands. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 012 — Label the guide conversation for screen readers. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 013 — Stop guide auto scrolling when reading older messages. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 014 — Retain sixty guide messages instead of only six. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 015 — Explain guide capabilities before commands are entered. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 016 — Associate guide input with its scope description. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 017 — Explain unmatched guide searches with an actionable hint. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 018 — Expose guide processing state to assistive technology. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
- [x] 019 — Include quiz help in the same capped suggestion slider. Validation: TypeScript syntax and diff checks; broader checks at checkpoints below.
