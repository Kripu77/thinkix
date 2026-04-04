const MAX_LINES = 200;
const MAX_BYTES = 50000;
const OVERFLOW_DIR = '/tmp/cmd-output';
const MAX_OVERFLOW_FILES = 20;
const MAX_OVERFLOW_BYTES = 2 * 1024 * 1024;

interface OverflowEntry {
  text: string;
  bytes: number;
}

let overflowCounter = 0;
let overflowBytes = 0;
const overflowFiles: Map<string, OverflowEntry> = new Map();

function isBinary(text: string): boolean {
  if (text.includes('\0')) return true;
  
  const buffer = Buffer.from(text.slice(0, 512));
  let controlChars = 0;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte === 0) return true;
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      controlChars++;
    }
  }
  
  return controlChars / buffer.length > 0.1;
}

function truncateSafely(text: string, maxLines: number): string {
  const lines = text.split('\n');
  if (lines.length <= maxLines) return text;
  
  const truncated = lines.slice(0, maxLines);
  let result = truncated.join('\n');
  
  const bytes = Buffer.byteLength(result, 'utf-8');
  if (bytes > MAX_BYTES) {
    let byteCount = 0;
    const safeLines: string[] = [];
    for (const line of truncated) {
      const lineBytes = Buffer.byteLength(line, 'utf-8') + 1;
      if (byteCount + lineBytes > MAX_BYTES) break;
      safeLines.push(line);
      byteCount += lineBytes;
    }
    result = safeLines.join('\n');
  }
  
  return result;
}

function countLines(text: string): number {
  return text.split('\n').length;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

function evictOverflowFiles(bytesNeeded: number): void {
  while (
    overflowFiles.size > 0 &&
    (overflowFiles.size >= MAX_OVERFLOW_FILES ||
      overflowBytes + bytesNeeded > MAX_OVERFLOW_BYTES)
  ) {
    const oldest = overflowFiles.entries().next().value as
      | [string, OverflowEntry]
      | undefined;

    if (!oldest) {
      break;
    }

    const [filename, entry] = oldest;
    overflowFiles.delete(filename);
    overflowBytes -= entry.bytes;
  }
}

function storeOverflow(text: string): string | null {
  const bytes = Buffer.byteLength(text, 'utf-8');
  if (bytes > MAX_OVERFLOW_BYTES) {
    return null;
  }

  evictOverflowFiles(bytes);

  overflowCounter++;
  const filename = `cmd-${overflowCounter}.txt`;
  overflowFiles.set(filename, { text, bytes });
  overflowBytes += bytes;
  return `${OVERFLOW_DIR}/${filename}`;
}

export function formatOutput(
  rawOutput: string,
  exitCode: number,
  duration: number,
): string {
  if (isBinary(rawOutput)) {
    return `[error] binary data detected. Use: see <element-id> for images
[exit:1 | ${formatDuration(duration)}]`;
  }
  
  const lines = countLines(rawOutput);
  const bytes = Buffer.byteLength(rawOutput, 'utf-8');
  
  if (lines > MAX_LINES || bytes > MAX_BYTES) {
    const truncated = truncateSafely(rawOutput, MAX_LINES);
    const overflowPath = storeOverflow(rawOutput);

    const overflowHint = overflowPath
      ? `Full output: ${overflowPath}
Explore: cat ${overflowPath} | grep <pattern>
         cat ${overflowPath} | tail 100`
      : 'Full output was not retained to avoid excessive memory usage.';

    return `${truncated}

--- output truncated (${lines} lines, ${formatBytes(bytes)}) ---
${overflowHint}
[exit:${exitCode} | ${formatDuration(duration)}]`;
  }
  
  if (rawOutput.length === 0) {
    return `[exit:${exitCode} | ${formatDuration(duration)}]`;
  }
  
  return `${rawOutput}
[exit:${exitCode} | ${formatDuration(duration)}]`;
}

export function formatError(message: string, duration: number = 0): string {
  return `[error] ${message}
[exit:1 | ${formatDuration(duration)}]`;
}

export function getOverflowFile(filename: string): string | undefined {
  return overflowFiles.get(filename)?.text;
}
