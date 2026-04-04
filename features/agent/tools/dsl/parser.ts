import type { ParseResult, DslNode } from './types';

type PeggyParser = (input: string, options: Record<string, unknown>) => { statements: DslNode[] };

let cachedParser: PeggyParser | null = null;

async function getParser(): Promise<PeggyParser> {
  if (!cachedParser) {
    const parserModule = await import('./parser.js');
    cachedParser = (parserModule as unknown as { parse: PeggyParser }).parse;
  }
  return cachedParser!;
}

export async function parseDSL(input: string): Promise<ParseResult> {
  const parse = await getParser();
  
  try {
    const result = parse(input, {});
    return {
      statements: result.statements as DslNode[],
      errors: [],
    };
  } catch (err) {
    if (err instanceof SyntaxError && 'location' in err) {
      const syntaxErr = err as SyntaxError & { location: { start: { line: number; column: number } }; message: string };
      return {
        statements: [],
        errors: [{
          message: syntaxErr.message,
          line: syntaxErr.location.start.line,
          column: syntaxErr.location.start.column,
        }],
      };
    }
    return {
      statements: [],
      errors: [{
        message: err instanceof Error ? err.message : 'Unknown parse error',
        line: 1,
        column: 1,
      }],
    };
  }
}
