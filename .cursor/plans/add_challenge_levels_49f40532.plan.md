---
name: Add Challenge Levels
overview: Implement a multi-level challenge flow where each level has a name, description, system prompt, and model, completion unlocks progression, and the UI includes a Continue button to advance to the next level.
todos:
  - id: create-level-config
    content: Create shared levels config with name + description + systemPrompt + model and helper accessors
    status: completed
  - id: inject-level-config-api
    content: Update chat API to read level index and use matching level system prompt + model
    status: completed
  - id: add-level-state-client
    content: Track current level in page state and pass it with chat requests
    status: completed
  - id: add-continue-ui
    content: Render current level info, progress bar, and Continue button in completion banner
    status: completed
  - id: manual-verification
    content: Verify progression across levels and final-level behavior
    status: completed
isProject: false
---

# Add Multi-Level Challenge Flow

## Goal

Add a level system with:

- level-specific `name` + `description` + `systemPrompt` + `model`
- server-side system prompt injection per current level
- server-side model selection per current level
- progression to the next level when challenge is complete
- a visible level progress bar
- a `Continue` button in the UI

## Files To Change

- [app/api/chat/route.ts](/Users/ingowolf/Projects/prompt-injection-thingy/app/api/chat/route.ts)
- [app/page.tsx](/Users/ingowolf/Projects/prompt-injection-thingy/app/page.tsx)
- [lib/levels.ts](/Users/ingowolf/Projects/prompt-injection-thingy/lib/levels.ts) (new)

## Implementation Steps

1. Add a shared levels configuration in `lib/levels.ts`.

- Export a typed array of levels, e.g. `{ id, name, description, systemPrompt, model }`.
- Export small helpers like `getLevelByIndex(index)` and `isLastLevel(index)`.
- Start with a few placeholder descriptions/prompts/models so behavior is testable and easy to edit.

1. Update chat API to accept the current level and apply its config.

- Extend request parsing in `app/api/chat/route.ts` from `{ messages }` to `{ messages, levelIndex }`.
- Validate `levelIndex` (default `0`, clamp or reject out-of-range).
- Select model from `levels[levelIndex].model` instead of relying only on `OPENROUTER_MODEL` fallback.
- Prepend a system message derived from `levels[levelIndex].systemPrompt` before `convertToModelMessages(...)`.
- Keep a safe fallback model for invalid/missing config.
- Keep existing `continue` tool behavior so completion detection still works client-side.

1. Add level state and transport wiring in `app/page.tsx`.

- Add `currentLevelIndex` state.
- Update `DefaultChatTransport` URL to include the current level (query param), or pass level in request body via transport options.
- Derive `currentLevel`, level name/description, and `isFinalLevel` from shared levels config.

1. Add progression UI, progress bar, and Continue button.

- Show current level name and description near the top of the page.
- Add a progress bar tied to `currentLevelIndex` and total levels.
- Compute progress percentage as `(currentLevelIndex + 1) / levels.length * 100`.
- Render accessible progress text (e.g. `Level 2 of 5`) alongside visual bar.
- In the existing completion banner area, add a `Continue` button when not on final level.
- `Continue` handler should:
  - increment `currentLevelIndex`
  - clear messages (`setMessages([])`)
  - clear input and focus input
- On final level completion, show a terminal message like `All levels complete` and hide/disable Continue.

1. Preserve/reset behavior intentionally.

- Keep Reset chat as “reset current level conversation only”.
- Ensure Continue is disabled while streaming.
- Ensure input remains disabled only while current level is completed, and becomes enabled after advancing.

1. Validate with quick manual checks.

- Complete level 1 -> Continue appears -> advances to level 2.
- Level header updates correctly.
- Progress bar advances correctly on each Continue action.
- Final level shows full progress state.
- API receives correct level and applies corresponding system prompt + model.
- Final level shows completion state without next-step button.

## Key Existing Hooks To Leverage

- Completion signal already exists via `tool-continue` in `app/api/chat/route.ts`.
- Completion detection already exists via `hasCompleteChallengeToolCall(...)` in `app/page.tsx`.
- Existing completion banner block in `app/page.tsx` is the natural insertion point for the Continue CTA.
