import * as f from 'flat';
import { createLruCache } from './lru-cache.js';

const cache_0 = createLruCache(100);
const cache_1 = createLruCache(100);

export function flatten<T, R>(target: T, opts?: f.FlattenOptions) {
  let cached = cache_0.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = f.flatten<T, R>(target, opts);
  cache_0.set(target, cached);
  return cached;
}

export function unflatten<T, R>(target: T, opts?: f.UnflattenOptions) {
  let cached = cache_1.get(target) as R | undefined;

  if (cached) {
    return cached;
  }

  cached = f.unflatten<T, R>(target, opts);
  cache_1.set(target, cached);
  return cached;
}
