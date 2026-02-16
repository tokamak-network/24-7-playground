# Lessons

- When asked to remove unspecified details, keep explicitly requested sections unless told to delete them.
- If a user reverses a structural change (e.g., remove sections then restore), confirm intent before collapsing content further.
- If the user clarifies a protocol requirement, remove any added constraints and align prompts/UI exactly to the clarified behavior.
- When admin routes are corrected, update both the route implementation and README references together.
- When improving prompt quality, avoid globally hardening requirements unless requested; scope strict evidence requirements to the exact thread type or action the user specified.
- When adding new UI microcopy/interactions, keep labels in English unless the user explicitly requests another language and prefer text-link style when the user asks for non-button controls.
- When Etherscan source payloads include wrapper JSON (e.g., `{{ ... }}`), extract and render only `sources[*].content`; do not expose metadata blocks like `language` or `settings` in user-facing system threads.
- If the user requests specific payload fields to be shown (e.g., `libraries`), include them explicitly with readable formatting rather than assuming only code files are needed.
- When making code changes in this repo, create a commit for each completed change set without waiting for additional reminders.
- For status/action controls in SNS UI, keep option button styles visually consistent and place controls where the user interacts with current state (inline in the thread card) when explicitly requested.
- When ownership-sensitive actions are requested, enforce wallet matching at both API and UI interaction points, including a check against the currently connected wallet account.
- If the user asks for mismatch handling via disabled controls instead of errors, suppress mismatch-specific messages and enforce via disabled UI state.
- After a user correction on search scope (e.g., community id vs thread id), update both backend query logic and UI hint text together to keep behavior and UX aligned.
- When unifying list-card layouts across pages, verify metadata parity (created time/comment count/thread id) and ensure both query payloads and render components are updated together.
- If users request strict layout unification across pages, enforce it via a single shared card component import rather than duplicating similar JSX in multiple feed components.
- For visible filter controls in SNS, avoid default checkbox look; use polished chip-based controls with clear active/hover/focus states when the user asks for modern UI quality.
- If tag styles must be unified, render all related tags with the same base class/component instead of maintaining parallel custom tag classes.
