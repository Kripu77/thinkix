'use client';

import { createRoot } from 'react-dom/client';
import type { PlaitTextBoard, TextProps } from '@plait/common';
import type { PlaitBoard } from '@plait/core';
import type { Element as SlateElement, Descendant } from 'slate';
import { createEditor } from 'slate';
import { withReact as withSlateReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Slate, Editable, RenderElementProps, RenderLeafProps } from 'slate-react';
import { useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { isKeyHotkey } from 'is-hotkey';
import { Transforms, Range } from 'slate';
import type { CustomElement, CustomText, ParagraphElement } from '@plait/common';

const DEFAULT_CHINESE_TEXT = '文本';

function getTextString(text: SlateElement): string {
  return text.children.map((child: any) => child.text || '').join('');
}

function normalizeTextValue(text: SlateElement | undefined): SlateElement {
  if (!text) {
    return { children: [{ text: '' }] };
  }
  if (!text.children || !Array.isArray(text.children)) {
    return { ...text, children: [{ text: '' }] };
  }
  const hasNullChildren = text.children.some((child: any) => child === null || child === undefined);
  if (hasNullChildren) {
    return {
      ...text,
      children: text.children.map((child: any) =>
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
  if ((leaf as CustomText).bold) {
    children = <strong>{children}</strong>;
  }
  if ((leaf as CustomText).code) {
    children = <code>{children}</code>;
  }
  if ((leaf as CustomText).italic) {
    children = <em>{children}</em>;
  }
  if ((leaf as CustomText).underlined) {
    children = <u>{children}</u>;
  }
  if ((leaf as CustomText).strike) {
    children = <s>{children}</s>;
  }

  const style: CSSProperties = {};
  if ((leaf as CustomText).color) {
    style.color = (leaf as CustomText).color;
  }
  const fontSize = (leaf as any)['font-size'];
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

  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);

  const initialValue: Descendant[] = [normalizeTextValue(text)];

  const editor = useMemo(() => {
    const e = withHistory(withSlateReact(createEditor()));
    afterInit?.(e);
    return e;
  }, []);

  useEffect(() => {
    const normalizedText = normalizeTextValue(text);
    if (normalizedText === editor.children[0]) {
      return;
    }
    editor.children = [normalizedText];
    editor.onChange();
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
      onChange={(value: Descendant[]) => {
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
          if (onComposition) {
            onComposition(event as unknown as CompositionEvent);
          }
        }}
        onCompositionUpdate={(event) => {
          if (onComposition) {
            onComposition(event as unknown as CompositionEvent);
          }
        }}
        onCompositionEnd={(event) => {
          if (onComposition) {
            onComposition(event as unknown as CompositionEvent);
          }
        }}
        onKeyDown={onKeyDown}
      />
    </Slate>
  );
};

const componentMap = new Map<string, {
  root: any;
  currentEditor: ReactEditor;
  currentProps: TextProps;
}>();
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
          props.afterInit && props.afterInit(editor);
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
          Object.keys(updatedProps).some(
            (key) => (updatedProps as any)[key] !== (newProps as any)[key]
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
