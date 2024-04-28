import * as f from 'flat';
import { createLruCache } from './lru-cache.js';
import type { GenericObject } from './types.js';

const cache_0 = createLruCache<GenericObject, GenericObject>(100);
const cache_1 = createLruCache<GenericObject, GenericObject>(100);

export function flatten<T extends GenericObject, R extends GenericObject>(
  target: T,
  options?: f.FlattenOptions,
) {
  let cached = cache_0.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = f.flatten<T, R>(target, options);
  cache_0.set(target, cached);
  return cached;
}

export function unflatten<T extends GenericObject, R extends GenericObject>(
  target: T,
  options?: f.UnflattenOptions,
) {
  let cached = cache_1.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = f.unflatten<T, R>(target, options);
  cache_1.set(target, cached);
  return cached;
}
