import cx from 'classnames'
import { $getRoot, BLUR_COMMAND, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from 'lexical'
import { EditorState } from 'lexical/LexicalEditorState'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { TextInputProps } from '@carbon/react/lib/components/TextInput/TextInput'

import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import { BadgeNode } from './BadgeNode'
import { useEditor } from './EditorProvider'
import { MultipleEditorStorePlugin } from './MultipleEditorStorePlugin'
import { NoEnterPlugin } from './NoEnterPlugin'
import { MatchPlugin } from './TextNodeTransformPlugin'
import classes from './index.module.scss'
import { getEditorContents, setEditorContent } from './utils'

interface Props {
  isTextArea?: boolean
  isTextInput?: boolean
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
  placeholder: TextInputProps['placeholder']
  value: TextInputProps['value']
  editorId: string
  onValueChange: (value: string) => void
  growToContent?: boolean
  editable?: boolean
}

const LexicalErrorBoundary: React.FC<{ children: JSX.Element; onError: (error: Error) => void }> = ({ children }) => {
  return <>{children}</>
}

export const LexicalContent = ({
  isTextArea,
  isTextInput,
  toHighlightWords,
  placeholder,
  editorId,
  value,
  onValueChange,
  growToContent,
  editable,
}: Props) => {
  const editor = useEditor(editorId)

  const _onChange = useCallback(
    (editorState: EditorState) => {
      onValueChange(editorState.read(() => $getRoot().getTextContent()))
    },
    [onValueChange],
  )

  useEffect(() => {
    if (editor !== null) {
      const editorContents = getEditorContents(editor)
      if ((editorContents === '' && value !== '') || editorContents !== value) {
        setEditorContent(value as string, editor)
      }
    }
  }, [editor, editorId, value])

  const theme: InitialConfigType['theme'] = useMemo(
    () => ({
      paragraph: cx(classes.paragraph, {
        [classes.textAreaLikeInner]: isTextArea,
        [classes.textInputLike]: isTextInput,
      }),
    }),
    [isTextArea, isTextInput],
  )

  const initialConfig: InitialConfigType = useMemo(
    () => ({
      namespace: editorId,
      onError(error: Error) {
        console.error(error)
      },
      nodes: [BadgeNode],
      theme,
    }),
    [editorId, theme],
  )

  return (
    <LexicalComposer initialConfig={{ ...initialConfig, namespace: editorId }} key={editorId}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={cx('cds--text-input', classes.contentEditable, {
              [classes.textAreaLikeOuter]: isTextArea,
              [classes.textInputLike]: isTextInput,
              [classes.growToContent]: growToContent,
            })}
            aria-placeholder={placeholder || ''}
            placeholder={<div className={classes.placeholder}>{placeholder || ''}</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MatchPlugin toHighlightWords={toHighlightWords} />
      {isTextInput && <NoEnterPlugin />}
      <HistoryPlugin />
      <MultipleEditorStorePlugin id={editorId} />
      {editable && (
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(editorState: EditorState) => {
            _onChange(editorState)
          }}
        />
      )}
    </LexicalComposer>
  )
}
