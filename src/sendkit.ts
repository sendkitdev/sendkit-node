import { Emails } from './emails/emails';
import type { ErrorResponse, Response } from './interfaces';

const defaultBaseUrl = 'https://api.sendkit.com';

export class SendKit {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  readonly emails = new Emails(this);

  constructor(
    readonly key?: string,
    options: { baseUrl?: string } = {},
  ) {
    if (!key) {
      if (typeof process !== 'undefined' && process.env) {
        this.key = process.env.SENDKIT_API_KEY;
      }

      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new SendKit("sk_...")`',
        );
      }
    }

    this.baseUrl = options.baseUrl ?? defaultBaseUrl;
    this.headers = {
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
    };
  }

  async post<T>(path: string, body?: unknown): Promise<Response<T>> {
    return this.fetchRequest<T>(path, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
  }

  async get<T>(path: string): Promise<Response<T>> {
    return this.fetchRequest<T>(path, {
      method: 'GET',
      headers: this.headers,
    });
  }

  async delete<T>(path: string): Promise<Response<T>> {
    return this.fetchRequest<T>(path, {
      method: 'DELETE',
      headers: this.headers,
    });
  }

  private async fetchRequest<T>(
    path: string,
    options: RequestInit,
  ): Promise<Response<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, options);

      if (!response.ok) {
        try {
          const rawError = await response.text();
          return {
            data: null,
            error: JSON.parse(rawError) as ErrorResponse,
          };
        } catch {
          return {
            data: null,
            error: {
              name: 'application_error',
              statusCode: response.status,
              message: response.statusText,
            },
          };
        }
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch {
      return {
        data: null,
        error: {
          name: 'application_error',
          statusCode: null,
          message: 'Unable to fetch data. The request could not be resolved.',
        },
      };
    }
  }
}
