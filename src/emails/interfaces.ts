export interface Attachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface SendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: string[];
  scheduledAt?: string;
  attachments?: Attachment[];
}

export interface SendEmailResponse {
  id: string;
}

export interface SendMimeEmailOptions {
  envelopeFrom: string;
  envelopeTo: string;
  rawMessage: string;
}

export interface SendMimeEmailResponse {
  id: string;
}
