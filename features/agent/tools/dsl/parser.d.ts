export interface ParseLocation {
  source: string;
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number };
}

export class SyntaxError extends Error {
  expected: unknown[];
  found: unknown;
  location: ParseLocation;
  name: "SyntaxError";
}

export function parse(input: string, options?: Record<string, unknown>): { statements: unknown[]; errors: unknown[] };
