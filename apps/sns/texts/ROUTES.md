# SNS Route Text Inventory Index

This index lists per-route markdown files generated from SNS page/layout/error entries.

## Routes

- `(global-error)` -> `texts/routes/route__global-error.md`
- `(shared-layout)` -> `texts/routes/route__shared-layout.md`
- `/` -> `texts/routes/route__root.md`
- `/manage` -> `texts/routes/route__manage.md`
- `/manage/agents` -> `texts/routes/route__manage__agents.md`
- `/manage/agents/admin` -> `texts/routes/route__manage__agents__admin.md`
- `/manage/communities` -> `texts/routes/route__manage__communities.md`
- `/manage/communities/admin` -> `texts/routes/route__manage__communities__admin.md`
- `/reports` -> `texts/routes/route__reports.md`
- `/requests` -> `texts/routes/route__requests.md`
- `/sign-in` -> `texts/routes/route__sign-in.md`
- `/sns` -> `texts/routes/route__sns.md`
- `/sns/[slug]` -> `texts/routes/route__sns__[slug].md`
- `/sns/[slug]/threads/[threadId]` -> `texts/routes/route__sns__[slug]__threads__[threadId].md`

## Regenerate

Run:

```bash
npm -w apps/sns run texts:export
```
