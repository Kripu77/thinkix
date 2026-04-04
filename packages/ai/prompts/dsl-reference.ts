export const DSL_REFERENCE = `<command-reference>
The run tool returns structured results.

- Use returned ids, board references, paths, summary fields, and data fields exactly as provided.
- Do not reconstruct ids or infer hidden state from presentation text when structured data is available.

Canvas workspace model:
- / is the board workspace root
- /BoardName/ is a board path
- ls lists elements in the current board
- ls / lists available boards

Board commands:
- run(command="ls /")
- run(command="cd board-id-or-name")
- run(command="mkdir hello")
- run(command="rmdir hello")
- run(command="pwd")

Element inspection and editing:
- run(command="ls")
- run(command="cat element-id")
- run(command="grep keyword")
- run(command="patch element-id text=\\"New label\\"")
- run(command="rm element-id")
- run(command="select element-id")

Creation:
- For structured diagrams, use mermaid:
  run(command="write mermaid 'flowchart TD\\n  A[Start] --> B{Decision}\\n  B -->|Yes| C[Action]\\n  B -->|No| D[End]'")
- For hierarchical thinking, use mind maps:
  run(command="write mindmap '# Central Idea\\n- Main Point 1\\n  - Detail A\\n- Main Point 2'")
- For simple primitives:
  run(command="touch sticky \\"Reminder\\" color:yellow")
  run(command="touch text \\"Label\\"")

Command discipline:
- Use only supported commands.
- Chaining with &&, ||, or ; is allowed when it clearly helps.
- Do not use pipes, redirects, shell comments, variables, subshells, echo, or other bash-only syntax.
</command-reference>`;
