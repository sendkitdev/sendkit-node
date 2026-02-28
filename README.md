# SendKit Node.js SDK

Official Node.js SDK for the [SendKit](https://sendkit.com) email API.

## Installation

```bash
npm install @sendkitdev/sdk
```

## Usage

### Create a Client

```typescript
import { SendKit } from '@sendkitdev/sdk';

const sendkit = new SendKit('sk_your_api_key');
```

### Send an Email

```typescript
const { data, error } = await sendkit.emails.send({
  from: 'you@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from SendKit',
  html: '<h1>Welcome!</h1>',
});

if (error) {
  console.error(error.message);
  return;
}

console.log(data.id); // Email ID
```

### Send a MIME Email

```typescript
const { data, error } = await sendkit.emails.sendMime({
  envelopeFrom: 'you@example.com',
  envelopeTo: 'recipient@example.com',
  rawMessage: mimeString,
});
```

### Error Handling

Every method returns `{ data, error }` — no exceptions to catch:

```typescript
const { data, error } = await sendkit.emails.send({ ... });

if (error) {
  console.error(error.name);       // e.g. 'validation_error'
  console.error(error.message);    // e.g. 'The to field is required.'
  console.error(error.statusCode); // e.g. 422
}
```
