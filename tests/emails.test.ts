import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendKit } from '../src/sendkit';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('SendKit', () => {
  it('throws if no API key is provided', () => {
    delete process.env.SENDKIT_API_KEY;
    expect(() => new SendKit()).toThrow('Missing API key');
  });

  it('creates a client with an API key', () => {
    const client = new SendKit('sk_test_123');
    expect(client.key).toBe('sk_test_123');
  });

  it('reads API key from environment variable', () => {
    process.env.SENDKIT_API_KEY = 'sk_from_env';
    const client = new SendKit();
    expect(client.key).toBe('sk_from_env');
    delete process.env.SENDKIT_API_KEY;
  });
});

describe('Emails', () => {
  it('sends a structured email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'email-uuid-123' }),
    });

    const client = new SendKit('sk_test_123');
    const { data, error } = await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email',
      html: '<p>Hello</p>',
    });

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'email-uuid-123' });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.sendkit.dev/emails');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer sk_test_123');

    const body = JSON.parse(options.body);
    expect(body.from).toBe('sender@example.com');
    expect(body.to).toBe('recipient@example.com');
    expect(body.subject).toBe('Test Email');
  });

  it('maps camelCase to snake_case', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'email-uuid-456' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      replyTo: 'reply@example.com',
      scheduledAt: '2026-03-01T10:00:00Z',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_to).toEqual(['reply@example.com']);
    expect(body.scheduled_at).toBe('2026-03-01T10:00:00Z');
  });

  it('sends a MIME email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'mime-uuid-789' }),
    });

    const client = new SendKit('sk_test_123');
    const { data, error } = await client.emails.sendMime({
      envelopeFrom: 'sender@example.com',
      envelopeTo: 'recipient@example.com',
      rawMessage: 'From: sender@example.com\r\nTo: recipient@example.com\r\n\r\nHello',
    });

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'mime-uuid-789' });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.sendkit.dev/emails/mime');

    const body = JSON.parse(options.body);
    expect(body.envelope_from).toBe('sender@example.com');
    expect(body.envelope_to).toBe('recipient@example.com');
    expect(body.raw_message).toContain('Hello');
  });

  it('returns error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: async () =>
        JSON.stringify({
          name: 'validation_error',
          statusCode: 422,
          message: 'The to field is required.',
        }),
    });

    const client = new SendKit('sk_test_123');
    const { data, error } = await client.emails.send({
      from: 'sender@example.com',
      to: '',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(data).toBeNull();
    expect(error).toEqual({
      name: 'validation_error',
      statusCode: 422,
      message: 'The to field is required.',
    });
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const client = new SendKit('sk_test_123');
    const { data, error } = await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(data).toBeNull();
    expect(error?.name).toBe('application_error');
    expect(error?.statusCode).toBeNull();
  });

  it('sends to multiple recipients', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'multi-to-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: ['alice@example.com', 'bob@example.com'],
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toEqual(['alice@example.com', 'bob@example.com']);
  });

  it('sends a plain text email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'text-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      text: 'Hello, plain text!',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe('Hello, plain text!');
    expect(body.html).toBeUndefined();
  });

  it('sends with cc and bcc', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'cc-bcc-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      cc: ['cc1@example.com', 'cc2@example.com'],
      bcc: 'bcc@example.com',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.cc).toEqual(['cc1@example.com', 'cc2@example.com']);
    expect(body.bcc).toEqual(['bcc@example.com']);
  });

  it('normalizes single-string replyTo to array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'reply-to-string-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      replyTo: 'reply@example.com',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_to).toEqual(['reply@example.com']);
  });

  it('passes replyTo array as-is', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'reply-to-array-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      replyTo: ['reply1@example.com', 'reply2@example.com'],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.reply_to).toEqual(['reply1@example.com', 'reply2@example.com']);
  });

  it('normalizes single-string cc and bcc to arrays', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'normalize-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.cc).toEqual(['cc@example.com']);
    expect(body.bcc).toEqual(['bcc@example.com']);
  });

  it('sends bcc as an array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'bcc-array-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      bcc: ['bcc1@example.com', 'bcc2@example.com'],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.bcc).toEqual(['bcc1@example.com', 'bcc2@example.com']);
  });

  it('sends with custom headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'headers-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      headers: { 'X-Custom-Header': 'custom-value', 'X-Entity-Ref': 'ref-123' },
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.headers).toEqual({
      'X-Custom-Header': 'custom-value',
      'X-Entity-Ref': 'ref-123',
    });
  });

  it('sends with tags as name/value objects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'tags-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      tags: [
        { name: 'category', value: 'transactional' },
        { name: 'environment', value: 'production' },
      ],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.tags).toEqual([
      { name: 'category', value: 'transactional' },
      { name: 'environment', value: 'production' },
    ]);
  });

  it('sends with attachments and maps contentType to content_type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'attach-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      attachments: [
        {
          filename: 'report.pdf',
          content: 'base64content',
          contentType: 'application/pdf',
        },
      ],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.attachments).toEqual([
      {
        filename: 'report.pdf',
        content: 'base64content',
        content_type: 'application/pdf',
      },
    ]);
    expect(body.attachments[0]).not.toHaveProperty('contentType');
  });

  it('omits undefined optional fields from the payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'minimal-123' }),
    });

    const client = new SendKit('sk_test_123');
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.from).toBe('sender@example.com');
    expect(body.to).toBe('recipient@example.com');
    expect(body.subject).toBe('Test');
    expect(body.html).toBe('<p>Hi</p>');
    expect(body).not.toHaveProperty('text');
    expect(body).not.toHaveProperty('cc');
    expect(body).not.toHaveProperty('bcc');
    expect(body).not.toHaveProperty('reply_to');
    expect(body).not.toHaveProperty('headers');
    expect(body).not.toHaveProperty('tags');
    expect(body).not.toHaveProperty('scheduled_at');
    expect(body).not.toHaveProperty('attachments');
  });

  it('uses custom base URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'custom-url-123' }),
    });

    const client = new SendKit('sk_test_123', {
      baseUrl: 'https://custom.api.com',
    });
    await client.emails.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://custom.api.com/emails');
  });
});
