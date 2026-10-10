import type { IncomingMessage, ServerResponse } from 'node:http';

/** The HTTP surface shared by Vercel Node functions and the local Express app. */
export interface HttpRequest extends IncomingMessage {
  body?: unknown;
}

export interface HttpResponse extends ServerResponse {
  status(statusCode: number): HttpResponse;
  json(body: unknown): HttpResponse;
}
