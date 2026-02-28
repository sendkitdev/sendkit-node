export type SendKitErrorCode =
  | 'validation_error'
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'not_found'
  | 'method_not_allowed'
  | 'rate_limit_exceeded'
  | 'application_error'
  | 'internal_server_error';

export interface ErrorResponse {
  message: string;
  statusCode: number | null;
  name: SendKitErrorCode;
}

export type Response<T> =
  | { data: T; error: null }
  | { data: null; error: ErrorResponse };
