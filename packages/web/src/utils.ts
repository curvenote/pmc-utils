import type { z } from 'zod';
import { u } from 'unist-builder';
import type { Element, Text } from 'xast';

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

/**
 * Formats Zod validation errors into a user-friendly status message
 * suitable for display in UI status text or error messages.
 *
 * @param error - The Zod validation error
 * @returns A concise, readable error message
 */
export function formatZodErrorForStatus(error: z.ZodError): string {
  if (error.errors.length === 0) {
    return 'Validation failed';
  }

  // Get the first error for a concise message
  const firstError = error.errors[0];

  // Build a user-friendly path
  const path =
    firstError.path.length > 0
      ? firstError.path
          .map((segment) => {
            // Convert array indices to more readable format
            if (typeof segment === 'number') {
              return `item ${segment + 1}`;
            }
            return segment;
          })
          .join(' - ')
      : 'manifest';

  // Create a user-friendly message
  let message = firstError.message;

  // Handle common validation errors with better messages
  if (message.includes('Required')) {
    message = 'is required';
  } else if (message.includes('Invalid')) {
    message = 'has an invalid value';
  } else if (message.includes('String must contain at least')) {
    message = 'cannot be empty';
  } else if (message.includes('Invalid email')) {
    message = 'must be a valid email address';
  } else if (message.includes('Invalid enum value')) {
    message = 'has an invalid value';
  }

  return `${path} ${message}`;
}

export function assertIsDefined<T>(value: T): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not defined`);
  }
}

export function t(value: string): Text {
  return u('text', value);
}
export function e(name: string, children?: string | any[]): Element;
export function e(
  name: string,
  attributes: Record<string, any>,
  children?: string | any[],
): Element;
export function e(name: string, attributes = {}, children?: string | any[]): Element {
  if ((children === undefined && typeof attributes === 'string') || Array.isArray(attributes)) {
    children = attributes;
    attributes = {};
  }
  if (typeof children === 'string') {
    return u('element', { name, attributes }, [t(children)]);
  }
  return u('element', { name, attributes }, children?.filter((c) => !!c) as Element[]);
}
