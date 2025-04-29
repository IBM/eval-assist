import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useState } from 'react'

import { IconButton, TextInput } from '@carbon/react'
import {
  AiLabel,
  Checkmark,
  Delete,
  MisuseOutline,
  Rotate,
  Send,
  TextLongParagraph,
  TextShortParagraph,
} from '@carbon/react/icons'

import { useSyntheticGeneration } from '@components/SingleExampleEvaluation/Providers/SyntheticGenerationProvider'
import { DirectActionTypeEnum } from '@types'

import classes from './DirectActionPopup.module.scss'
import { PromptPopup } from './PromptPopup'

interface Props {
  popupPosition: { top: number; left: number }
  selectedText: string
  wholeText: string
  popupVisible: boolean
  setPopupVisible: Dispatch<SetStateAction<boolean>>
  onChange: (newValue: string) => void
  promptPopupVisible: boolean
  setPromptPopupVisible: Dispatch<SetStateAction<boolean>>
  textAreaRef: RefObject<HTMLTextAreaElement>
}

export const DirectActionPopup = ({
  popupPosition,
  wholeText,
  selectedText,
  popupVisible,
  promptPopupVisible,
  textAreaRef,
  setPopupVisible,
  setPromptPopupVisible,
  onChange,
}: Props) => {
  const { performDirectAIAction, loadingDirectAIAction } = useSyntheticGeneration()
  const [prompt, setPrompt] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const onDirectActionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, action: DirectActionTypeEnum, prompt?: string) => {
      e.preventDefault() // Prevent focus shift

      const res = await performDirectAIAction({ text: wholeText, selection: selectedText, action })
      onChange && res && onChange(wholeText.replace(selectedText, res))
      setGeneratedText(res)
      setPromptPopupVisible(false)
      setPopupVisible(false)
      setConfirmationOpen(true)
    },
    [onChange, performDirectAIAction, selectedText, setPopupVisible, setPromptPopupVisible, wholeText],
  )

  useEffect(() => {
    if (!textAreaRef.current) {
      return
    }

    const startIndex = wholeText.indexOf(generatedText)

    if (startIndex !== -1) {
      const endIndex = startIndex + generatedText.length - 1
      textAreaRef.current.setSelectionRange(startIndex, endIndex)
    }
  }, [generatedText, textAreaRef, wholeText])

  const closeAll = useCallback(() => {
    setPopupVisible(false)
    setPromptPopupVisible(false)
    setConfirmationOpen(false)
  }, [setPopupVisible, setPromptPopupVisible])

  console.log(confirmationOpen)

  const onCancelClick = useCallback(() => {
    closeAll()
    onChange && generatedText && onChange(wholeText.replace(generatedText, selectedText))
  }, [closeAll, generatedText, onChange, selectedText, wholeText])

  const onConfirmClick = useCallback(() => {
    closeAll()
    onChange && generatedText && onChange(wholeText.replace(selectedText, generatedText))
  }, [closeAll, generatedText, onChange, selectedText, wholeText])

  return (
    (popupVisible || promptPopupVisible || confirmationOpen) && (
      <div
        style={{
          top: popupPosition.top + 3,
          left: popupPosition.left + 3,
        }}
        className={classes.popoverContainer}
      >
        {popupVisible && (
          <div className={classes.optionsContainer}>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Rephrase}
              onMouseDown={(e) => onDirectActionClick(e, DirectActionTypeEnum.Rephrase)}
            >
              <Rotate />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Elaborate}
              onMouseDown={(e) => onDirectActionClick(e, DirectActionTypeEnum.Elaborate)}
            >
              <TextLongParagraph />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Shorten}
              onMouseDown={(e) => onDirectActionClick(e, DirectActionTypeEnum.Shorten)}
            >
              <TextShortParagraph />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={'Custom prompt'}
              onMouseDown={(e) => {
                e.preventDefault()
                setPromptPopupVisible(!promptPopupVisible)
              }}
            >
              <AiLabel />
            </IconButton>
          </div>
        )}
        {promptPopupVisible && (
          <div className={classes.promptContainer}>
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
              onMouseDown={(e) => onDirectActionClick(e, DirectActionTypeEnum.Custom, prompt)}
            >
              <Delete />
            </IconButton>
          </div>
        )}
        {confirmationOpen && (
          <div className={classes.promptContainer}>
            <IconButton className={classes.iconButton} kind={'ghost'} label={'Cancel'} onMouseDown={onCancelClick}>
              <MisuseOutline />
            </IconButton>
            <IconButton className={classes.iconButton} kind={'ghost'} label={'Confirm'} onMouseDown={onConfirmClick}>
              <Checkmark />
            </IconButton>
          </div>
        )}
      </div>
    )
  )
}
