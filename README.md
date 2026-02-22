# Simple Chat with Vercel AI SDK + shadcn/ui

This project is a Next.js App Router chat interface that uses:

- `useChat` from `@ai-sdk/react`
- OpenAI via `@ai-sdk/openai`
- shadcn/ui components added through the shadcn CLI

## Setup

1. Install dependencies:

```bash
bun install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`.  
Optional: override `OPENAI_MODEL` (default: `gpt-4o-mini`).

## Run

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- Client UI: `/app/page.tsx`
  - Uses `useChat({ api: "/api/chat" })`
  - Renders messages, input, loading/error states
- API route: `/app/api/chat/route.ts`
  - Accepts `POST` chat requests from `useChat`
  - Converts UI messages to model messages
  - Streams model output back to the client

## Validation

Run checks:

```bash
bun run lint
bun run build
```
