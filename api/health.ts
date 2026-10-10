import type { HttpRequest, HttpResponse } from '../lib/http.js';
import { configuredModel, tracingConfigured } from '../lib/ai.js';

export default function health(req: HttpRequest, res: HttpResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET for this endpoint.', code: 'METHOD_NOT_ALLOWED' });
  }
  return res.status(200).json({
    aiConfigured: Boolean(process.env.NEBIUS_API_KEY?.trim()),
    tracingConfigured: tracingConfigured(),
    model: configuredModel(),
    service: 'SpareCycle',
  });
}
