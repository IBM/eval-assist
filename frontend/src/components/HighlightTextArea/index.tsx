import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical'

import React, { useCallback, useEffect } from 'react'

import { TextInputProps } from '@carbon/react/lib/components/TextInput/TextInput'

import { CarbonWrapper } from './CarbonWrapper'
import { useEditor } from './EditorProvider'
import { LexicalContent } from './LexicalContent'
import { LexicalWrapper } from './LexicalWrapper'
import { getEditorContents, setEditorContent } from './utils'

interface Props extends TextInputProps {
  wordList: string[]
  isTextArea?: boolean
  isTextInput?: boolean
  lexicalId: string
}

const HighlightTextArea = ({
  value,
  labelText,
  wordList,
  className,
  placeholder,
  isTextArea = false,
  isTextInput = false,
  lexicalId,
}: Props) => {
  return (
    // <LexicalWrapper lexicalId={lexicalId} isTextArea={isTextArea} isTextInput={isTextInput}>
    <CarbonWrapper isTextArea={isTextArea} isTextInput={isTextInput} labelText={labelText} className={className}>
      <LexicalContent
        isTextArea={isTextArea}
        isTextInput={isTextInput}
        wordList={wordList}
        placeholder={placeholder}
        lexicalId={lexicalId}
        value={value}
      />
    </CarbonWrapper>
    // </LexicalWrapper>
  )
}

export default HighlightTextArea
