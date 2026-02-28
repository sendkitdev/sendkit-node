# SendKit Node.js SDK

## Project Overview

Node.js SDK for the SendKit email API. Uses native `fetch`, zero runtime dependencies.

## Architecture

```
src/
├── index.ts              # Barrel exports
├── sendkit.ts            # Core client: holds API key, exposes HTTP methods (post, get, delete)
├── interfaces.ts         # Response<T>, ErrorResponse, error code union
└── emails/
    ├── emails.ts         # Emails resource class (send, sendMime)
    └── interfaces.ts     # Email-specific types
```

- `SendKit` class is the entry point, accepts API key + optional baseUrl
- Discriminated union response: `{ data: T; error: null } | { data: null; error: ErrorResponse }`
- Resource classes (Emails) receive the `SendKit` client via constructor and call `this.sendkit.post<T>()`
- camelCase SDK interface → snake_case API payloads (replyTo → reply_to, scheduledAt → scheduled_at)
- `POST /v1/emails` for structured emails, `POST /v1/emails/mime` for raw MIME

## Tech Stack

- TypeScript, native fetch (Node 18+)
- tsdown for dual ESM/CJS build
- Vitest for testing
- Zero runtime dependencies

## Testing

- Run tests: `npm test`
- Tests mock global `fetch` with `vi.fn()`
- No HTTP calls in tests

## Releasing

- Tags use numeric format: `0.1.0`, `0.2.0` (no `v` prefix)
- CI runs tests + creates GitHub Release + updates npm

## Git

- NEVER add `Co-Authored-By` lines to commit messages
