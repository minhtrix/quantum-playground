import {
  buildLocalTutorResponse,
  type QuantumLabSnapshot,
} from '../src/simulation/quantum-physics.js';

export interface TutorRequestBody {
  question?: unknown;
  snapshot?: unknown;
}

export interface TutorServerOutcome {
  status: number;
  body: {
    ok: boolean;
    source: 'local-physics' | 'openrouter' | 'anthropic';
    headline: string;
    answer: string;
    notice?: string;
  };
}

export interface TutorEnvConfig {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
}

export interface TutorByokOverrides {
  byokKey?: string;
  byokProvider?: string;
}

export class SlidingWindowRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 30,
    private readonly windowMs = 60_000,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter(
      (ts) => now - ts < this.windowMs,
    );
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}

const defaultLimiter = new SlidingWindowRateLimiter();

const VALID_MODES = new Set([
  'bomb_puzzle',
  'tether',
  'schrodinger',
  'double_slit',
  'entanglement',
]);

function isValidSnapshot(raw: unknown): raw is QuantumLabSnapshot {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Record<string, unknown>;
  return (
    typeof s.experiment === 'string' &&
    VALID_MODES.has(s.experiment) &&
    typeof s.wavelengthNm === 'number' &&
    typeof s.slitSeparationMm === 'number' &&
    typeof s.whichPathDetector === 'boolean' &&
    typeof s.aliceAngleDeg === 'number' &&
    typeof s.bobAngleDeg === 'number'
  );
}

const DEFAULT_SNAPSHOT: QuantumLabSnapshot = {
  experiment: 'bomb_puzzle',
  score: 0,
  streak: 0,
  roomscaleWave: false,
  bombRound: 1,
  bombSlotCrate: null,
  bombBs2Installed: true,
  bombPhasePiEnabled: false,
  bombProbesFired: 0,
  bombDarkHits: 0,
  bombSafeHits: 0,
  bombDefusedCount: 0,
  bombLastOutcome: 'idle',
  tetherMode: 'correlated',
  tetherDistanceM: 0.34,
  tetherLeftSpin: null,
  tetherRightSpin: null,
  tetherCollapses: 0,
  schrodingerClosed: true,
  schrodingerProbAwake: 0.5,
  schrodingerProbAsleep: 0.5,
  schrodingerPhaseSign: 1,
  schrodingerGates: 'H',
  schrodingerObserved: null,
  wavelengthNm: 532,
  slitSeparationMm: 0.48,
  screenDistanceScale: 1.0,
  slitMode: 'both',
  whichPathDetector: false,
  totalHits: 0,
  theoreticalVisibility: 0.94,
  measuredFringeContrast: 0,
  aliceAngleDeg: 0,
  bobAngleDeg: 22.5,
  pairCount: 0,
  sameOutcomeCount: 0,
  oppositeOutcomeCount: 0,
  theoreticalCorrelation: 0.707,
  measuredCorrelation: 0,
  chshWitnessS: null,
  questStep: 1,
  lastOutcomeA: null,
  lastOutcomeB: null,
};

function sanitizeJsonResponse(
  rawText: string,
  fallback: { headline: string; answer: string },
): { headline: string; answer: string } {
  const trimmed = rawText.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as {
        headline?: unknown;
        answer?: unknown;
      };
      if (
        typeof parsed.headline === 'string' &&
        typeof parsed.answer === 'string' &&
        parsed.answer.trim().length > 0
      ) {
        return {
          headline: parsed.headline.trim().slice(0, 72),
          answer: parsed.answer.trim().slice(0, 520),
        };
      }
    } catch {
      // Fallback below
    }
  }
  return trimmed.length > 0
    ? {
        headline: fallback.headline,
        answer: trimmed.slice(0, 480),
      }
    : fallback;
}

export async function processTutorRequest(
  rawBody: unknown,
  clientIp: string,
  env: TutorEnvConfig = {},
  byok: TutorByokOverrides = {},
  limiter: SlidingWindowRateLimiter = defaultLimiter,
): Promise<TutorServerOutcome> {
  if (!limiter.allow(clientIp)) {
    return {
      status: 429,
      body: {
        ok: false,
        source: 'local-physics',
        headline: 'Rate limit reached',
        answer:
          'Too many tutor requests in one minute. Wait a moment and ask again.',
      },
    };
  }

  if (!rawBody || typeof rawBody !== 'object') {
    const local = buildLocalTutorResponse('explain current experiment', DEFAULT_SNAPSHOT);
    return {
      status: 400,
      body: {
        ok: false,
        source: 'local-physics',
        headline: local.headline,
        answer: local.answer,
        notice: 'Invalid JSON request payload; returning physics summary.',
      },
    };
  }

  const req = rawBody as TutorRequestBody;
  const question =
    typeof req.question === 'string' && req.question.trim().length > 0
      ? req.question.trim().slice(0, 400)
      : 'Explain what I am observing right now.';
  const snapshot: QuantumLabSnapshot = isValidSnapshot(req.snapshot)
    ? { ...DEFAULT_SNAPSHOT, ...req.snapshot }
    : DEFAULT_SNAPSHOT;
  const localFallback = buildLocalTutorResponse(question, snapshot);

  const byokKey = byok.byokKey?.trim() ?? '';
  const openRouterKey =
    byok.byokProvider === 'openrouter' && byokKey
      ? byokKey
      : env.OPENROUTER_API_KEY?.trim() || '';
  const anthropicKey =
    byok.byokProvider === 'anthropic' && byokKey
      ? byokKey
      : env.ANTHROPIC_API_KEY?.trim() || '';

  if (!openRouterKey && !anthropicKey) {
    return {
      status: 200,
      body: {
        ok: true,
        source: 'local-physics',
        headline: localFallback.headline,
        answer: localFallback.answer,
      },
    };
  }

  const systemPrompt =
    'You are Aria, an encouraging Quantum Physics Tutor guiding a Mixed Reality optics lab. ' +
    'Answer concisely in plain ASCII English (max 3 short sentences) based strictly on the live bench state. ' +
    'Respond ONLY with JSON: {"headline":"...","answer":"..."}.';
  const userPrompt = `Live bench state:\n${JSON.stringify(snapshot)}\n\nStudent question: ${question}`;

  try {
    if (anthropicKey) {
      const model = env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-4-5-20251001';
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 240,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (!resp.ok) {
        return {
          status: 200,
          body: {
            ok: true,
            source: 'local-physics',
            headline: localFallback.headline,
            answer: localFallback.answer,
            notice: `Anthropic returned HTTP ${resp.status}; using local physics tutor.`,
          },
        };
      }
      const data = (await resp.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
      const parsed = sanitizeJsonResponse(text, localFallback);
      return {
        status: 200,
        body: {
          ok: true,
          source: 'anthropic',
          headline: parsed.headline,
          answer: parsed.answer,
        },
      };
    }

    const model = env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 240,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!resp.ok) {
      return {
        status: 200,
        body: {
          ok: true,
          source: 'local-physics',
          headline: localFallback.headline,
          answer: localFallback.answer,
          notice: `OpenRouter returned HTTP ${resp.status}; using local physics tutor.`,
        },
      };
    }
    const data = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = sanitizeJsonResponse(text, localFallback);
    return {
      status: 200,
      body: {
        ok: true,
        source: 'openrouter',
        headline: parsed.headline,
        answer: parsed.answer,
      },
    };
  } catch {
    return {
      status: 200,
      body: {
        ok: true,
        source: 'local-physics',
        headline: localFallback.headline,
        answer: localFallback.answer,
        notice: 'Live AI endpoint unreachable; using local physics tutor.',
      },
    };
  }
}
