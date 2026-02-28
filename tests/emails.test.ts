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
    expect(url).toBe('https://api.sendkit.com/v1/emails');
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
    expect(body.reply_to).toBe('reply@example.com');
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
    expect(url).toBe('https://api.sendkit.com/v1/emails/mime');

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
    expect(url).toBe('https://custom.api.com/v1/emails');
  });
});
