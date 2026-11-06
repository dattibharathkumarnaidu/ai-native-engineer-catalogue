/**
 * All configuration comes from the environment (12-factor) and is validated
 * once at startup so misconfiguration fails fast with a clear message.
 */
export interface AppConfig {
  port: number;
  corsOrigins: string[];
  productSource: {
    fakeStoreBaseUrl: string;
    cacheTtlMs: number;
    timeoutMs: number;
    currency: string;
  };
  merchandising: {
    featuredProductIds: string[];
    categoryTopRatedCount: number;
  };
  mail: {
    transport: 'smtp' | 'console';
    salesInbox: string;
    from: string;
    smtp: { host: string; port: number; secure: boolean; user?: string; pass?: string };
  };
  enquiryRateLimitPerMinute: number;
}

type Env = Record<string, string | undefined>;

function int(env: Env, key: string, fallback: number, errors: string[]): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    errors.push(`${key} must be a non-negative integer (got "${raw}")`);
    return fallback;
  }
  return value;
}

function list(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function loadConfig(env: Env = process.env): AppConfig {
  const errors: string[] = [];

  const transport = env.MAIL_TRANSPORT ?? 'smtp';
  if (transport !== 'smtp' && transport !== 'console') {
    errors.push(`MAIL_TRANSPORT must be "smtp" or "console" (got "${transport}")`);
  }

  const featuredProductIds = list(env.FEATURED_PRODUCT_IDS, ['1', '5', '9', '13', '17']);
  if (featuredProductIds.length === 0) errors.push('FEATURED_PRODUCT_IDS must contain at least one id');

  const config: AppConfig = {
    port: int(env, 'PORT', 4000, errors),
    corsOrigins: list(env.CORS_ORIGINS, ['http://localhost:5173']),
    productSource: {
      fakeStoreBaseUrl: env.FAKESTORE_BASE_URL ?? 'https://fakestoreapi.com',
      cacheTtlMs: int(env, 'CATALOG_CACHE_TTL_SECONDS', 300, errors) * 1000,
      timeoutMs: int(env, 'PRODUCT_SOURCE_TIMEOUT_MS', 5000, errors),
      currency: env.CURRENCY ?? 'USD',
    },
    merchandising: {
      featuredProductIds,
      categoryTopRatedCount: int(env, 'CATEGORY_TOP_RATED_COUNT', 3, errors),
    },
    mail: {
      transport: transport === 'console' ? 'console' : 'smtp',
      salesInbox: env.SALES_INBOX ?? 'sales@example.com',
      from: env.MAIL_FROM ?? 'Catalogue <no-reply@example.com>',
      smtp: {
        host: env.SMTP_HOST ?? 'localhost',
        port: int(env, 'SMTP_PORT', 1025, errors),
        secure: env.SMTP_SECURE === 'true',
        ...(env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : {}),
      },
    },
    enquiryRateLimitPerMinute: int(env, 'ENQUIRY_RATE_LIMIT_PER_MINUTE', 5, errors),
  };

  try {
    new URL(config.productSource.fakeStoreBaseUrl);
  } catch {
    errors.push('FAKESTORE_BASE_URL must be a valid URL');
  }

  if (errors.length > 0) throw new Error(`Invalid configuration:\n  - ${errors.join('\n  - ')}`);
  return config;
}
