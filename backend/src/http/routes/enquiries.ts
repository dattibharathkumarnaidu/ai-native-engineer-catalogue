import { Router, type RequestHandler } from 'express';
import type { EnquiryService } from '../../services/EnquiryService.js';

export function enquiryRoutes(enquiries: EnquiryService, rateLimiter: RequestHandler): Router {
  const router = Router();

  router.post('/', rateLimiter, async (req, res) => {
    const receipt = await enquiries.submit(req.body);
    res.status(201).json(receipt);
  });

  return router;
}
