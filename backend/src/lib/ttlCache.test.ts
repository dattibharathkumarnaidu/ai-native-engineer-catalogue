import { describe, expect, it } from 'vitest';
import { cachedLoader } from './ttlCache.js';

describe('cachedLoader', () => {
  it('reuses the value within the TTL and reloads after it expires', async () => {
    let clock = 0;
    let calls = 0;
    const load = cachedLoader(async () => ++calls, 1000, () => clock);

    expect(await load()).toBe(1);
    clock = 999;
    expect(await load()).toBe(1);
    clock = 1001;
    expect(await load()).toBe(2);
  });

  it('shares a single in-flight request between concurrent callers', async () => {
    let calls = 0;
    const load = cachedLoader(async () => ++calls, 1000);
    const results = await Promise.all([load(), load(), load()]);
    expect(results).toEqual([1, 1, 1]);
  });

  it('does not cache failures', async () => {
    let calls = 0;
    const load = cachedLoader(async () => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
      return 'ok';
    }, 1000);

    await expect(load()).rejects.toThrow('boom');
    expect(await load()).toBe('ok');
  });
});
