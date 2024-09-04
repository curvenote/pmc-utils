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
