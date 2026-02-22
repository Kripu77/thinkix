'use client';

import { createRoot, Root } from 'react-dom/client';
import type { PlaitTextBoard, TextProps, CustomText, ParagraphElement } from '@plait/common';
import type { PlaitBoard } from '@plait/core';
import type { Element as SlateElement, Descendant } from 'slate';
import { createEditor } from 'slate';
import { withReact as withSlateReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react';
import { useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { isKeyHotkey } from 'is-hotkey';
import { Transforms, Range } from 'slate';

const DEFAULT_CHINESE_TEXT = '文本';

interface TextNode {
  text: string;
}

function getTextString(text: SlateElement): string {
  return text.children
    .map((child) => (child as TextNode).text || '')
    .join('');
}

function normalizeTextValue(text: SlateElement | undefined): SlateElement {
  if (!text) {
    return { children: [{ text: '' }] };
  }
  if (!text.children || !Array.isArray(text.children)) {
    return { ...text, children: [{ text: '' }] };
  }
  const hasNullChildren = text.children.some((child) => child === null || child === undefined);
  if (hasNullChildren) {
    return {
      ...text,
      children: text.children.map((child) =>
        child === null || child === undefined ? { text: '' } : child
      )
    };
  }
  if (text.children.length === 0) {
    return { ...text, children: [{ text: '' }] };
  }

  const textString = getTextString(text);
  if (textString === DEFAULT_CHINESE_TEXT) {
    return { ...text, children: [{ text: '' }] };
  }

  return text;
}

const Leaf: React.FC<RenderLeafProps> = ({ children, leaf, attributes }) => {
  const customLeaf = leaf as CustomText;
  
  if (customLeaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (customLeaf.code) {
    children = <code>{children}</code>;
  }
  if (customLeaf.italic) {
    children = <em>{children}</em>;
  }
  if (customLeaf.underlined) {
    children = <u>{children}</u>;
  }
  if (customLeaf.strike) {
    children = <s>{children}</s>;
  }

  const style: CSSProperties = {};
  if (customLeaf.color) {
    style.color = customLeaf.color;
  }
  const fontSize = customLeaf['font-size'];
  if (fontSize) {
    const sizeValue = typeof fontSize === 'number' ? fontSize : parseInt(fontSize, 10);
    if (!isNaN(sizeValue)) {
      style.fontSize = `${sizeValue}px`;
    }
  }

  return (
    <span style={style} {...attributes}>
      {children}
    </span>
  );
};

const Element = (props: RenderElementProps) => {
  const { attributes, children, element } = props as RenderElementProps & { element: ParagraphElement };
  const style = { textAlign: element.align } as CSSProperties;
  return (
    <div style={style} {...attributes}>
      {children}
    </div>
  );
};

const TextComponent: React.FC<TextProps> = (props) => {
  const { text, readonly, onChange, onComposition, afterInit } = props;

  const renderLeaf = useCallback((leafProps: RenderLeafProps) => <Leaf {...leafProps} />, []);
  const renderElement = useCallback((elementProps: RenderElementProps) => <Element {...elementProps} />, []);

  const initialValue: Descendant[] = [normalizeTextValue(text)];

  const editor = useMemo(() => {
    const e = withHistory(withSlateReact(createEditor()));
    return e;
  }, []);

  useEffect(() => {
    if (afterInit) {
      afterInit(editor);
    }
  }, [editor, afterInit]);

  useEffect(() => {
    const normalizedText = normalizeTextValue(text);
    if (normalizedText === editor.children[0]) {
      return;
    }
    Transforms.removeNodes(editor, { at: [0] });
    Transforms.insertNodes(editor, normalizedText, { at: [0] });
  }, [text, editor]);

  const onKeyDown: React.KeyboardEventHandler = (event) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      if (isKeyHotkey('left', event.nativeEvent)) {
        event.preventDefault();
        Transforms.move(editor, { unit: 'offset', reverse: true });
        return;
      }
      if (isKeyHotkey('right', event.nativeEvent)) {
        event.preventDefault();
        Transforms.move(editor, { unit: 'offset' });
        return;
      }
    }
  };

  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={() => {
        onChange?.({
          newText: editor.children[0] as ParagraphElement,
          operations: editor.operations
        });
      }}
    >
      <Editable
        className="slate-editable-container plait-text-container"
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        readOnly={readonly === undefined ? true : readonly}
        onCompositionStart={(event) => {
          onComposition?.(event as unknown as CompositionEvent);
        }}
        onCompositionUpdate={(event) => {
          onComposition?.(event as unknown as CompositionEvent);
        }}
        onCompositionEnd={(event) => {
          onComposition?.(event as unknown as CompositionEvent);
        }}
        onKeyDown={onKeyDown}
      />
    </Slate>
  );
};

interface ComponentEntry {
  root: Root;
  currentEditor: ReactEditor;
  currentProps: TextProps;
}

const componentMap = new Map<string, ComponentEntry>();
let renderId = 0;

export function addTextRenderer(board: PlaitBoard) {
  const textBoard = board as PlaitBoard & PlaitTextBoard;
  textBoard.renderText = (container, props) => {
    const id = `${container}-${renderId++}`;

    const root = createRoot(container);
    let currentEditor: ReactEditor;

    const text = (
      <TextComponent
        {...props}
        afterInit={(editor) => {
          currentEditor = editor as ReactEditor;
          if (props.afterInit) {
            props.afterInit(editor);
          }
        }}
      />
    );

    root.render(text);
    let newProps = { ...props };

    componentMap.set(id, { root, currentEditor: currentEditor!, currentProps: newProps });

    return {
      destroy: () => {
        setTimeout(() => {
          root.unmount();
          componentMap.delete(id);
        }, 0);
      },
      update: (updatedProps: Partial<TextProps>) => {
        const hasUpdated =
          updatedProps &&
          newProps &&
          (Object.keys(updatedProps) as (keyof TextProps)[]).some(
            (key) => updatedProps[key] !== newProps[key]
          );
        if (!hasUpdated) {
          return;
        }
        const readonly = ReactEditor.isReadOnly(currentEditor!);
        newProps = { ...newProps, ...updatedProps };
        root.render(
          <TextComponent
            {...newProps}
            afterInit={(editor) => {
              if (!currentEditor) {
                currentEditor = editor as ReactEditor;
              }
            }}
          />
        );

        if (readonly === true && newProps.readonly === false) {
          setTimeout(() => {
            ReactEditor.focus(currentEditor!);
          }, 100);
        } else if (readonly === false && newProps.readonly === true) {
          ReactEditor.blur(currentEditor!);
          ReactEditor.deselect(currentEditor!);
        }
      },
    };
  };

  return board;
}
