import { flatten as originalFlatten, type FlattenOptions } from 'flat';
import { createLruCache } from './lru-cache.js';
import type { GenericObject } from './types.js';

const cache = createLruCache<GenericObject, GenericObject>(100);

export function flatten<T extends GenericObject, R extends GenericObject>(
  target: T,
  options?: FlattenOptions,
) {
  let cached = cache.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = originalFlatten<T, R>(target, options);
  cache.set(target, cached);
  return cached;
}
