import { FakeStoreProductRepository } from './adapters/fakestore/FakeStoreProductRepository.js';
import { ConsoleMailer } from './adapters/mail/ConsoleMailer.js';
import { SmtpMailer } from './adapters/mail/SmtpMailer.js';
import { StaticMerchandising } from './adapters/merchandising/StaticMerchandising.js';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { consoleLogger as logger } from './lib/logger.js';
import type { Mailer } from './ports/Mailer.js';
import { CatalogService } from './services/CatalogService.js';
import { EnquiryService } from './services/EnquiryService.js';

/**
 * Composition root: the ONLY place that knows which concrete adapters are in use.
 * Swapping the product source, email provider or merchandising source = change here.
 */
// Local dev convenience: load backend/.env if present (Docker/AWS inject real env vars).
try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to process env + defaults.
}
const config = loadConfig();

const products = new FakeStoreProductRepository({
  baseUrl: config.productSource.fakeStoreBaseUrl,
  cacheTtlMs: config.productSource.cacheTtlMs,
  timeoutMs: config.productSource.timeoutMs,
  currency: config.productSource.currency,
  logger,
});

const mailer: Mailer =
  config.mail.transport === 'console' ? new ConsoleMailer(logger) : new SmtpMailer(config.mail.smtp);

const merchandising = new StaticMerchandising(
  config.merchandising.featuredProductIds,
  config.merchandising.categoryTopRatedCount,
);

const app = createApp({
  catalog: new CatalogService(products, merchandising, logger),
  enquiries: new EnquiryService(
    products,
    mailer,
    { salesInbox: config.mail.salesInbox, fromAddress: config.mail.from },
    logger,
  ),
  logger,
  corsOrigins: config.corsOrigins,
  enquiryRateLimitPerMinute: config.enquiryRateLimitPerMinute,
});

const server = app.listen(config.port, () => {
  logger.info('Backend listening', { port: config.port, mailTransport: config.mail.transport });
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info('Shutting down', { signal });
    server.close(() => process.exit(0));
  });
}
