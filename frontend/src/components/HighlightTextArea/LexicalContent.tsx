import cx from 'classnames'
import { EditorState } from 'lexical'

import { useEffect } from 'react'

import { TextInputProps } from '@carbon/react/lib/components/TextInput/TextInput'

import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'

import { useEditor, useEditorsContext } from './EditorProvider'
import { MultipleEditorStorePlugin } from './MultipleEditorStorePlugin'
import { NoEnterPlugin } from './NoEnterPlugin'
import { MatchPlugin } from './TextNodeTransformPlugin'
import classes from './index.module.scss'
import { getEditorContents, setEditorContent } from './utils'

interface Props {
  isTextArea?: boolean
  isTextInput?: boolean
  wordList: string[]
  placeholder: TextInputProps['placeholder']
  value: TextInputProps['value']
  lexicalId: string
}

const LexicalErrorBoundary: React.FC<{ children: JSX.Element; onError: (error: Error) => void }> = ({ children }) => {
  return <>{children}</>
}

export const LexicalContent = ({ isTextArea, isTextInput, wordList, placeholder, lexicalId, value }: Props) => {
  const editor = useEditor(lexicalId)
  console.log(editor)
  const { textContents, setTextContents } = useEditorsContext()
  useEffect(() => {
    if (editor !== null) {
      const editorContents = getEditorContents(editor)
      // console.log('lexicalId')
      // console.log(lexicalId)
      // console.log('value')
      // console.log(value)
      // console.log('editorContents')
      // console.log(editorContents)
      // console.log('textContents')
      // console.log(textContents[lexicalId])
      // console.log("editorContents === ''")
      // console.log(editorContents === '')
      // console.log('editorContents !== value')
      // console.log(editorContents !== value)
      // console.log('\n')
      if ((editorContents === '' && value !== '') || editorContents !== value) {
        console.log(`updating ${lexicalId} with: \n ${value}`)
        setEditorContent(value as string, editor)
        setTextContents((currTextContents) => {
          return { ...currTextContents, [lexicalId]: value as string }
        })
      }
    }
  }, [editor, lexicalId, setTextContents, textContents, value])

  // if (editorIds.length === 0) return null
  return (
    <>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={cx('cds--text-input', classes.contentEditable, {
              [classes.textAreaLikeOuter]: isTextArea,
              [classes.textInputLike]: isTextInput,
            })}
            aria-placeholder={placeholder || ''}
            placeholder={<div className={classes.placeholder}>{placeholder || ''}</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MatchPlugin wordList={wordList} />
      {isTextInput && <NoEnterPlugin />}
      <HistoryPlugin />
      {/* <MultipleEditorStorePlugin id={lexicalId} /> */}
      {/* <OnChangePlugin
      onChange={(editorState: EditorState) => {
        onChange(editorState, lexicalId)
      }}
    /> */}
    </>
  )
}
