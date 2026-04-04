interface ChainStep {
  command: string;
  operator: '|' | '&&' | '||' | ';' | null;
}

const ESCAPE_SEQUENCES: Record<string, string> = {
  '\\': '\\',
  '"': '"',
  "'": "'",
  n: '\n',
  r: '\r',
  t: '\t',
};

function unescapeQuotedArgument(value: string): string {
  let result = '';

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char !== '\\' || i === value.length - 1) {
      result += char;
      continue;
    }

    const next = value[i + 1];
    result += ESCAPE_SEQUENCES[next] ?? next;
    i++;
  }

  return result;
}

export function parseChain(input: string): ChainStep[] {
  const steps: ChainStep[] = [];
  let current = '';
  let i = 0;
  
  while (i < input.length) {
    const char = input[i];
    const nextChar = input[i + 1];
    
    if (char === '|' && nextChar === '|') {
      if (current.trim()) {
        steps.push({ command: current.trim(), operator: '||' });
      }
      current = '';
      i += 2;
      continue;
    }
    
    if (char === '&' && nextChar === '&') {
      if (current.trim()) {
        steps.push({ command: current.trim(), operator: '&&' });
      }
      current = '';
      i += 2;
      continue;
    }
    
    if (char === '|') {
      if (current.trim()) {
        steps.push({ command: current.trim(), operator: '|' });
      }
      current = '';
      i += 1;
      continue;
    }
    
    if (char === ';') {
      if (current.trim()) {
        steps.push({ command: current.trim(), operator: ';' });
      }
      current = '';
      i += 1;
      continue;
    }
    
    if (char === '"' || char === "'") {
      const quote = char;
      current += char;
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          current += input[i] + input[i + 1];
          i += 2;
        } else {
          current += input[i];
          i++;
        }
      }
      if (i < input.length) {
        current += input[i];
        i++;
      }
      continue;
    }
    
    current += char;
    i++;
  }
  
  if (current.trim()) {
    steps.push({ command: current.trim(), operator: null });
  }
  
  return steps;
}

export function parseCommand(cmd: string): { name: string; args: string[] } {
  const tokens: string[] = [];
  let current = '';
  let i = 0;
  
  while (i < cmd.length) {
    const char = cmd[i];
    
    if (char === '"' || char === "'") {
      const quote = char;
      current += char;
      i++;
      while (i < cmd.length && cmd[i] !== quote) {
        if (cmd[i] === '\\' && i + 1 < cmd.length) {
          current += cmd[i] + cmd[i + 1];
          i += 2;
        } else {
          current += cmd[i];
          i++;
        }
      }
      if (i < cmd.length) {
        current += cmd[i];
        i++;
      }
      continue;
    }
    
    if (char === ' ' || char === '\t') {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = '';
      i++;
      continue;
    }
    
    current += char;
    i++;
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }
  
  const name = tokens[0] || '';
  const args = tokens.slice(1).map(arg => {
    if ((arg.startsWith('"') && arg.endsWith('"')) || 
        (arg.startsWith("'") && arg.endsWith("'"))) {
      return unescapeQuotedArgument(arg.slice(1, -1));
    }
    return arg;
  });
  
  return { name, args };
}
