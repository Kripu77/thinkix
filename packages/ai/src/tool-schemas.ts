import { z } from 'zod';

const run = {
  description: `Execute canvas workspace commands.

This is not a general Unix shell.
Use only the supported canvas commands below. Command results are structured; trust returned ids, paths, summaries, and data over guesses.

Workspace model:
- / contains boards
- /BoardName/ is a board path

Navigation:
  ls              list elements in the current board
  ls /            list all boards
  ls -a           list all boards
  cd <board>      switch to a board by unique name or id
  pwd             show the current board path

Board operations:
  mkdir <name>    create a new board and switch into it
  rmdir <name>    delete a board by unique name or id, except the last remaining board

Element operations:
  cat <id>        read element details
  touch <type> [text] create a simple shape, sticky, or text element
  rm <id...>      delete elements
  cp <id>         duplicate an element
  patch <id> key=value
  grep <pattern>  search elements by text
  select <id...>  highlight elements
  select --clear  clear selection

Diagram creation:
  write mermaid "flowchart TD\\n  A --> B"
  write mindmap "# Topic\\n- Branch"

Preferred usage:
- use ls before modifying existing board content
- use ls / before switching or deleting boards when uncertain
- use mkdir when you need a fresh board

Chaining:
- &&, ||, and ; are supported when useful
- do not use pipes, redirects, comments, env vars, subshells, or shell builtins like echo`,
  parameters: z.object({
    command: z.string().describe('Canvas workspace command to execute'),
  }),
};

const web_search = {
  description:
    'Search the public web for fresh or external information. Use this only when current facts, outside knowledge, or explicit research are needed. Prefer concise queries and summarize findings with source titles or URLs.',
  parameters: z.object({
    query: z.string().describe('The search query.'),
    numResults: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe('Number of results to return, from 1 to 10. Defaults to 5.'),
  }),
};

export const toolSchemas = { run, web_search } as const;
