import { Dispatch, SetStateAction, useCallback, useState } from 'react'

import { IconButton, TextArea, TextInput } from '@carbon/react'
import { Send } from '@carbon/react/icons'

import { useSyntheticGeneration } from '@components/SingleExampleEvaluation/Providers/SyntheticGenerationProvider'
import { DirectActionTypeEnum } from '@types'

import classes from './DirectActionPopup.module.scss'

interface Props {
  popupPosition: { top: number; left: number }
  selectedText: string
  wholeText: string
  promptPopupVisible: boolean
  onChange: (newValue: string) => void
  setPromptPopupVisible: Dispatch<SetStateAction<boolean>>
}

export const PromptPopup = ({
  popupPosition,
  wholeText,
  selectedText,
  promptPopupVisible,
  onChange,
  setPromptPopupVisible,
}: Props) => {
  const [prompt, setPrompt] = useState('')

  const { performDirectAIAction, loadingDirectAIAction } = useSyntheticGeneration()

  const onDirectActionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault() // Prevent focus shift

      const res = await performDirectAIAction({
        text: wholeText,
        selection: selectedText,
        action: prompt as DirectActionTypeEnum,
      })
      onChange && res && onChange(wholeText.replace(selectedText, res))
      setPromptPopupVisible(false)
    },
    [onChange, performDirectAIAction, prompt, selectedText, setPromptPopupVisible, wholeText],
  )

  return (
    promptPopupVisible && (
      <div
        style={{
          top: popupPosition.top + 10,
          left: popupPosition.left + 10,
        }}
        className={classes.popoverContainer}
      >
        <TextInput
          autoFocus
          labelText={''}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          id={'da-prompt'}
        />
        <IconButton
          className={classes.iconButton}
          kind={'ghost'}
          label={'Custom prompt'}
          onMouseDown={onDirectActionClick}
        >
          <Send />
        </IconButton>
      </div>
    )
  )
}
