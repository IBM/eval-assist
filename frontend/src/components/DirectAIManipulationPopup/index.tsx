import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useState } from 'react'

import { IconButton, TextInput } from '@carbon/react'
import { AiLabel, Checkmark, Rotate, Send, TextLongParagraph, TextShortParagraph, Undo } from '@carbon/react/icons'

import { useSyntheticGeneration } from '@components/SingleExampleEvaluation/Providers/SyntheticGenerationProvider'
import { DirectActionTypeEnum } from '@types'

import classes from './index.module.scss'

interface Props {
  popupPosition: { top: number; left: number }
  selectedText: string
  wholeText: string
  onChange: (newValue: string) => void
  textAreaRef: RefObject<HTMLTextAreaElement>
  setSelectedText: Dispatch<SetStateAction<string>>
  popupVisibility: DirectAIManipulationPopupVisibility
  setPopupVisibility: Dispatch<SetStateAction<DirectAIManipulationPopupVisibility>>
  generatedText: string
  setGeneratedText: Dispatch<SetStateAction<string>>
}

export interface DirectAIManipulationPopupVisibility {
  options: boolean
  prompt: boolean
  confirmation: boolean
}

export const DirectAIManipulationPopup = ({
  popupPosition,
  wholeText,
  selectedText,
  textAreaRef,
  popupVisibility,
  generatedText,
  setGeneratedText,
  setPopupVisibility,
  onChange,
  setSelectedText,
}: Props) => {
  const { performDirectAIAction, loadingDirectAIAction } = useSyntheticGeneration()
  const [prompt, setPrompt] = useState('')

  const onOptionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, action: DirectActionTypeEnum, prompt?: string) => {
      e.preventDefault() // Prevent focus shift

      const res = await performDirectAIAction({ text: wholeText, selection: selectedText, action })
      onChange && res && onChange(wholeText.replace(selectedText, res))
      setGeneratedText(res)
      setPopupVisibility({ options: false, prompt: false, confirmation: true })
    },
    [onChange, performDirectAIAction, selectedText, setGeneratedText, setPopupVisibility, wholeText],
  )

  const onCustomOptionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setPopupVisibility({ options: false, prompt: true, confirmation: false })
    },
    [setPopupVisibility],
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
    setPopupVisibility({ options: false, prompt: false, confirmation: false })
  }, [setPopupVisibility])

  const clean = useCallback(() => {
    closeAll()
    setGeneratedText('')
    setPrompt('')
    setSelectedText('')
    textAreaRef.current?.setSelectionRange(null, null)
  }, [closeAll, setGeneratedText, setSelectedText, textAreaRef])

  const onCancelClick = useCallback(() => {
    clean()
    onChange && generatedText && onChange(wholeText.replace(generatedText, selectedText))
  }, [clean, generatedText, onChange, selectedText, wholeText])

  const onConfirmClick = useCallback(() => {
    clean()
  }, [clean])

  return (
    Object.values(popupVisibility).some((x) => x) && (
      <div
        style={{
          top: popupPosition.top + 3,
          left: popupPosition.left + 3,
        }}
        className={classes.popoverContainer}
      >
        {popupVisibility.options && (
          <div className={classes.optionsContainer}>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Rephrase}
              onMouseDown={(e) => onOptionClick(e, DirectActionTypeEnum.Rephrase)}
            >
              <Rotate />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Elaborate}
              onMouseDown={(e) => onOptionClick(e, DirectActionTypeEnum.Elaborate)}
            >
              <TextLongParagraph />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={DirectActionTypeEnum.Shorten}
              onMouseDown={(e) => onOptionClick(e, DirectActionTypeEnum.Shorten)}
            >
              <TextShortParagraph />
            </IconButton>
            <IconButton
              className={classes.iconButton}
              kind={'ghost'}
              label={'Custom prompt'}
              onMouseDown={onCustomOptionClick}
            >
              <AiLabel />
            </IconButton>
          </div>
        )}
        {popupVisibility.prompt && (
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
              onMouseDown={(e) => onOptionClick(e, DirectActionTypeEnum.Custom, prompt)}
            >
              <Send />
            </IconButton>
          </div>
        )}
        {popupVisibility.confirmation && (
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
