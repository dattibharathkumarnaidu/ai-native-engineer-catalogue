import { Router } from 'express';
import type { Product } from '../../domain/product.js';
import type { CatalogService } from '../../services/CatalogService.js';

function clientProduct(product: Product): Product {
  return { ...product, imageUrl: `/api/products/${encodeURIComponent(product.id)}/image` };
}

/** Thin HTTP adapter: parse request → call use case → serialise. No business logic here. */
export function catalogRoutes(catalog: CatalogService): Router {
  const router = Router();

  router.get('/featured', async (_req, res) => {
    res.json({ products: (await catalog.getFeatured()).map(clientProduct) });
  });

  router.get('/categories', async (_req, res) => {
    res.json({ categories: await catalog.listCategories() });
  });

  router.get('/categories/:slug', async (req, res) => {
    const page = await catalog.getCategoryPage(req.params.slug);
    res.json({
      ...page,
      topRated: page.topRated.map(clientProduct),
      more: page.more.map(clientProduct),
    });
  });

  router.get('/search', async (req, res) => {
    const result = await catalog.search(req.query.q);
    res.json({ ...result, results: result.results.map(clientProduct) });
  });

  router.get('/products/:id/image', async (req, res) => {
    const image = await catalog.getProductImage(req.params.id);
    res.set('Cache-Control', 'public, max-age=300');
    res.type(image.contentType).send(Buffer.from(image.bytes));
  });

  router.get('/products/:id', async (req, res) => {
    res.json({ product: clientProduct(await catalog.getProduct(req.params.id)) });
  });

  return router;
}
