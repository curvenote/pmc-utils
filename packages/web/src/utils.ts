import type { z } from 'zod';

export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map((err, index) => {
      const path = err.path.length > 0 ? err.path.join(' -> ') : 'root';
      return `Error ${index + 1}:
Path: ${path}
Issue: ${err.message}`;
    })
    .join('\n\n');
}

export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}
