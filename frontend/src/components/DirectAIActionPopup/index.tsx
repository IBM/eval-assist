import { Dispatch, RefObject, SetStateAction, useCallback, useEffect, useState } from 'react'

import { IconButton, TextInput } from '@carbon/react'
import {
  AiLabel,
  Checkmark,
  MagicWand,
  Rotate,
  Send,
  TextLongParagraph,
  TextShortParagraph,
  Undo,
} from '@carbon/react/icons'

import { DirectActionTypeEnum } from '@constants'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useSelectedTextContext } from '@providers/SelectedTextProvider'
import { useSyntheticGeneration } from '@providers/SyntheticGenerationProvider'

import classes from './index.module.scss'

interface Props {
  popupPosition: { top: number; left: number }
  wholeText: string
  onChange: (newValue: string) => void
  textAreaRef: RefObject<HTMLTextAreaElement>
  popupVisibility: DirectAIActionPopupVisibility
  instanceId: string
  fieldName: string
  generatedText: string
  setGeneratedText: Dispatch<SetStateAction<string>>
}

export interface DirectAIActionPopupVisibility {
  options: boolean
  prompt: boolean
  confirmation: boolean
}

export const DirectAIActionPopup = ({
  popupPosition,
  wholeText,
  textAreaRef,
  popupVisibility,
  generatedText,
  setGeneratedText,
  instanceId,
  fieldName,
  // setPopupVisibility,
  onChange,
}: Props) => {
  const { performDirectAIAction, loadingDirectAIAction } = useSyntheticGeneration()
  const [prompt, setPrompt] = useState('')
  const [actionedText, setActionedText] = useState('')
  const { selectedText, setSelectedText, isMouseUp } = useSelectedTextContext()
  const { post } = useFetchUtils()
  const onOptionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, action: DirectActionTypeEnum, prompt?: string) => {
      e.preventDefault() // Prevent focus shift
      e.stopPropagation()
      setActionedText(selectedText)
      const res = await performDirectAIAction({
        text: wholeText,
        selection: selectedText,
        action,
        prompt,
        instanceId,
        fieldName,
      })
      onChange && res && onChange(wholeText.replace(selectedText, res))
      setGeneratedText(res)
    },
    [fieldName, instanceId, onChange, performDirectAIAction, selectedText, setGeneratedText, wholeText],
  )

  const onCustomOptionClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // setPopupVisibility({ options: true, prompt: true, confirmation: false })
  }, [])

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

  const clean = useCallback(() => {
    setGeneratedText('')
    setPrompt('')
    setActionedText('')
    setSelectedText('')
    console.log('jererereere')
  }, [setGeneratedText, setSelectedText])

  const onCancelClick = useCallback(() => {
    post('log_user_action/', {
      action: 'direct_ai_action_confirmation',
      content: {
        accepted: false,
        generatedText,
        actionedText,
        instanceId,
        fieldName,
      },
    })
    onChange && generatedText && onChange(wholeText.replace(generatedText, actionedText))
    clean()
  }, [actionedText, clean, fieldName, generatedText, instanceId, onChange, post, wholeText])

  const onConfirmClick = useCallback(() => {
    post('log_user_action/', {
      action: 'direct_ai_action_confirmation',
      content: {
        accepted: true,
        generatedText,
        actionedText,
        instanceId,
        fieldName,
      },
    })
    clean()
  }, [actionedText, clean, fieldName, generatedText, instanceId, post])

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
              label={DirectActionTypeEnum.Regenerate}
              onMouseDown={(e) => onOptionClick(e, DirectActionTypeEnum.Regenerate)}
            >
              <MagicWand />
            </IconButton>
            {/* <IconButton
              disabled
              className={classes.iconButton}
              kind={'ghost'}
              label={'Custom prompt'}
              onMouseDown={onCustomOptionClick}
            >
              <AiLabel />
            </IconButton> */}
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
