# Lessons

## 2026-03-01
- When user requests layout matching a visual reference, prioritize structural placement first (region layout, fixed rails, element anchoring) before tone refinements.
- If user says elements must move to a specific side, remove duplicated legacy placements instead of leaving both old/new headers.
- For full-screen composition requests, explicitly zero out outer shell max-width and side padding; do not rely on content-level cards to imply full width.
