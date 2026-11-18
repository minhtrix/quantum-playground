import type { IncomingMessage, ServerResponse } from 'node:http';
import { processTutorRequest } from '../../server/tutor-engine.js';

function readJsonBody(req: IncomingMessage, maxBytes = 24 * 1024): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function getHeader(req: IncomingMessage, name: string): string {
  const val = req.headers[name.toLowerCase()];
  if (Array.isArray(val)) return val[0] ?? '';
  return typeof val === 'string' ? val : '';
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = await readJsonBody(req);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_request_body' }));
    return;
  }

  const forwarded = getHeader(req, 'x-forwarded-for').split(',')[0]?.trim();
  const clientIp = forwarded || req.socket?.remoteAddress || 'unknown';

  const outcome = await processTutorRequest(
    parsedBody,
    clientIp,
    {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
    },
    {
      byokKey: getHeader(req, 'x-byok-api-key'),
      byokProvider: getHeader(req, 'x-byok-provider'),
    },
  );

  res.statusCode = outcome.status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(outcome.body));
}
