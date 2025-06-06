import React, { memo } from 'react'

import { TextInputProps } from '@carbon/react/lib/components/TextInput/TextInput'

import { CarbonWrapper } from './CarbonWrapper'
import { LexicalContent } from './LexicalContent'

interface Props extends TextInputProps {
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
  isTextArea?: boolean
  isTextInput?: boolean
  editorId: string
  onValueChange: (value: string) => void
  growToContent?: boolean
  editable?: boolean
}

export const HighlightTextArea = ({
  value,
  labelText,
  toHighlightWords,
  className,
  placeholder,
  isTextArea = false,
  isTextInput = false,
  editorId,
  growToContent = false,
  editable = true,
  onValueChange,
}: Props) => {
  return (
    <CarbonWrapper isTextArea={isTextArea} isTextInput={isTextInput} labelText={labelText} className={className}>
      <LexicalContent
        isTextArea={isTextArea}
        isTextInput={isTextInput}
        toHighlightWords={toHighlightWords}
        placeholder={placeholder}
        editorId={editorId}
        value={value}
        onValueChange={onValueChange}
        growToContent={growToContent}
        editable={editable}
      />
    </CarbonWrapper>
  )
}
