import { unflatten as originalUnflatten, type UnflattenOptions } from 'flat';
import { createLruCache } from './lru-cache.js';
import type { GenericObject } from './types.js';

const cache = createLruCache<GenericObject, GenericObject>(100);

export function unflatten<T extends GenericObject, R extends GenericObject>(
  target: T,
  options?: UnflattenOptions,
) {
  let cached = cache.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = originalUnflatten<T, R>(target, options);
  cache.set(target, cached);
  return cached;
}
