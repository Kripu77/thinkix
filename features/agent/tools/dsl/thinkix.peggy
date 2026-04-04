{
}

start
  = statements:statement* { return { statements: statements.filter(Boolean), errors: [] }; }

statement
  = shapeStatement
  / stickyStatement
  / textStatement
  / connectStatement
  / mindmapStatement
  / mermaidStatement
  / patchStatement
  / layoutStatement
  / blankLine
  / commentLine

blankLine
  = [ \t]* "\n" { return null; }

commentLine
  = [ \t]* "//" [^\n]* "\n" { return null; }

shapeStatement
  = "shape" _ shape:shapeType _ text:string id:id? eos {
      return { type: 'shape', shape, text, id: id || undefined };
    }

shapeType
  = "rect" { return 'rect'; }
  / "ellipse" { return 'ellipse'; }
  / "diamond" { return 'diamond'; }
  / "roundRect" { return 'roundRect'; }
  / "cloud" { return 'cloud'; }
  / "star" { return 'star'; }
  / "triangle" { return 'triangle'; }
  / "parallelogram" { return 'parallelogram'; }
  / "hexagon" { return 'hexagon'; }

stickyStatement
  = "sticky" _ text:string ("color:" color:stickyColor)? id:id? eos {
      return { type: 'sticky', text, color: color || undefined, id: id || undefined };
    }

stickyColor
  = "yellow" { return 'yellow'; }
  / "blue" { return 'blue'; }
  / "green" { return 'green'; }
  / "pink" { return 'pink'; }
  / "purple" { return 'purple'; }
  / "orange" { return 'orange'; }

textStatement
  = "text" _ text:string id:id? eos {
      return { type: 'text', text, id: id || undefined };
    }

connectStatement
  = "connect" _ "id:" sourceId:id _ "->" _ "id:" targetId:id
    ( _ "label:" label:string)?
    ( _ "style:" style:arrowStyle)?
    eos {
      return { type: 'connect', sourceId, targetId, label: label || undefined, style: style || undefined };
    }

arrowStyle
  = "straight" { return 'straight'; }
  / "curve" { return 'curve'; }
  / "elbow" { return 'elbow'; }

mindmapStatement
  = "mindmap" _ text:string eos children:mindmapChild* {
      return { type: 'mindmap', root: { text, children: children.length > 0 ? children : undefined } };
    }

mindmapChild
  = indent:indent+ text:string eos children:mindmapChild* {
      const child = { text };
      if (children.length > 0) {
        child.children = children;
      }
      return child;
    }

indent
  = "  " / "\t"

mermaidStatement
  = "mermaid" _ code:mermaidBlock eos {
      return { type: 'mermaid', code };
    }

mermaidBlock
  = "```" "\n"? code:mermaidContent "\n"? "```" { return code; }

mermaidContent
  = chars:(!("\n" / eos? "```") .)* { return chars.join('').trim(); }

patchStatement
  = "patch" _ id:id props:patchProp+ eos {
      return { type: 'patch', id, props: Object.fromEntries(props) };
    }

patchProp
  = _ name:patchPropName ":" value:patchPropValue {
      return [name, value];
    }

patchPropName
  = "text" { return 'text'; }
  / "fill" { return 'fill'; }
  / "stroke" { return 'stroke'; }
  / "strokeWidth" { return 'strokeWidth'; }
  / "color" { return 'color'; }

patchPropValue
  = string
  / hexColor
  / number

hexColor
  = "#" chars:[0-9a-fA-F]+ { return '#' + chars.join(''); }

number
  = digits:[0-9]+ { return digits.join(''); }

layoutStatement
  = "layout" _ mode:layoutMode eos {
      if (mode.mode === 'near') {
        return { type: 'layout', mode: 'near', nearId: mode.id };
      }
      return { type: 'layout', mode };
    }

layoutMode
  = "grid" { return 'grid'; }
  / "row" { return 'row'; }
  / "near:" id:id { return { mode: 'near', id }; }

string
  = '"' chars:[^"]* '"' { return chars.join(''); }

id
  = _ chars:[a-zA-Z0-9_]+ { return chars.join(''); }

eos
  = [ \t]* ("\n" / end)

_ "whitespace"
  = [ \t]+
  / ""

end
  = !.
