import type { Response } from '../interfaces';
import type { SendKit } from '../sendkit';
import type {
  SendEmailOptions,
  SendEmailResponse,
  SendMimeEmailOptions,
  SendMimeEmailResponse,
} from './interfaces';

export class Emails {
  constructor(private readonly sendkit: SendKit) {}

  async send(payload: SendEmailOptions): Promise<Response<SendEmailResponse>> {
    return this.sendkit.post<SendEmailResponse>('/emails', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      cc: payload.cc,
      bcc: payload.bcc,
      reply_to: payload.replyTo,
      headers: payload.headers,
      tags: payload.tags,
      scheduled_at: payload.scheduledAt,
      attachments: payload.attachments,
    });
  }

  async sendMime(
    payload: SendMimeEmailOptions,
  ): Promise<Response<SendMimeEmailResponse>> {
    return this.sendkit.post<SendMimeEmailResponse>('/emails/mime', {
      envelope_from: payload.envelopeFrom,
      envelope_to: payload.envelopeTo,
      raw_message: payload.rawMessage,
    });
  }
}
