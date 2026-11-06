import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './http/errorHandler.js';
import { catalogRoutes } from './http/routes/catalog.js';
import { enquiryRoutes } from './http/routes/enquiries.js';
import type { Logger } from './ports/Logger.js';
import type { CatalogService } from './services/CatalogService.js';
import type { EnquiryService } from './services/EnquiryService.js';

export interface AppDependencies {
  catalog: CatalogService;
  enquiries: EnquiryService;
  logger: Logger;
  corsOrigins: string[];
  enquiryRateLimitPerMinute: number;
}

/** Builds the Express app from injected dependencies, so tests can pass fakes. */
export function createApp(deps: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind nginx / an AWS load balancer
  app.use(helmet());
  app.use(cors({ origin: deps.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const enquiryLimiter = rateLimit({
    windowMs: 60_000,
    limit: deps.enquiryRateLimitPerMinute || Number.MAX_SAFE_INTEGER,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many enquiries. Please try again in a minute.' } },
  });

  app.use('/api', catalogRoutes(deps.catalog));
  app.use('/api/enquiries', enquiryRoutes(deps.enquiries, enquiryLimiter));

  app.use(notFoundHandler);
  app.use(errorHandler(deps.logger));
  return app;
}
