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
  Undo,
} from '@carbon/react/icons'

import { useSyntheticGeneration } from '@components/SingleExampleEvaluation/Providers/SyntheticGenerationProvider'
import { DirectActionTypeEnum } from '@types'

import classes from './DirectActionPopup.module.scss'

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
  setSelectedText: Dispatch<SetStateAction<string>>
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
  setSelectedText,
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
    if (!textAreaRef.current || !generatedText) {
      return
    }
    const startIndex = wholeText.indexOf(generatedText)

    if (startIndex !== -1) {
      const endIndex = startIndex + generatedText.length
      textAreaRef.current.setSelectionRange(startIndex, endIndex)
    }
  }, [generatedText, selectedText, textAreaRef, wholeText])

  const closeAll = useCallback(() => {
    setPopupVisible(false)
    setPromptPopupVisible(false)
    setConfirmationOpen(false)
  }, [setPopupVisible, setPromptPopupVisible])

  const clean = useCallback(() => {
    closeAll()
    setGeneratedText('')
    setPrompt('')
    setSelectedText('')
    textAreaRef.current?.setSelectionRange(null, null)
  }, [closeAll, setSelectedText, textAreaRef])

  const onCancelClick = useCallback(() => {
    clean()
    onChange && generatedText && onChange(wholeText.replace(generatedText, selectedText))
  }, [clean, generatedText, onChange, selectedText, wholeText])

  const onConfirmClick = useCallback(() => {
    clean()
  }, [clean])

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
              <Send />
            </IconButton>
          </div>
        )}
        {confirmationOpen && (
          <div className={classes.promptContainer}>
            <IconButton className={classes.iconButton} kind={'ghost'} label={'Cancel'} onMouseDown={onCancelClick}>
              <Undo />
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
