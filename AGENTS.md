# ebike Frontend Admin Instructions

Shared workspace rules live in `../.github/copilot-instructions.md`.

Use this file for admin frontend-specific guidance only.

## Project Context

- This repo is the internal admin Next.js app for category management, product management, moderation, thread and review inspection, and operational tooling.
- Stack: Next.js 16, React 19, Mantine UI, Redux Toolkit, React Hook Form, Supabase Auth.
- Primary areas: `src/app/`, `src/components/`, `src/api-actions/`, `src/hooks/`, `src/models/`, `src/store/`, and `src/utils/`.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Working Style

- Preserve the existing Mantine, form, table, and admin workflow patterns unless the task clearly requires a broader refactor.
- Prefer precise workflow fixes over UI-wide redesigns.
- If a change depends on extraction, relevance, product resolution, validation, ratings, or category configuration, confirm the backend source of truth before changing admin presentation logic.
- For debugging workflow issues tied to processing runs, moderation state, product resolution, or config-driven behavior, inspect Loki logs and Loki-backed processing traces before assuming the admin UI is the source of the problem.
- Do not guess API contracts, IDs, or configuration shapes when backend code or MCP can confirm them.
