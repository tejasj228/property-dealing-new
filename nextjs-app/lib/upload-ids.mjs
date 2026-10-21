import { randomUUID } from 'node:crypto';

/** An id no other upload can share, even when many files arrive in the same millisecond. */
export function uniquePublicId(prefix = 'property') {
  return `${prefix}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}
