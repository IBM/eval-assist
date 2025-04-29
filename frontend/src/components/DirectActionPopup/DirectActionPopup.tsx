import { Dispatch, SetStateAction, useCallback, useState } from 'react'

import { IconButton, InlineLoading, Popover, PopoverContent } from '@carbon/react'
import { AiLabel, Rotate, TextLongParagraph, TextShortParagraph } from '@carbon/react/icons'

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
}

export const DirectActionPopup = ({
  popupPosition,
  wholeText,
  selectedText,
  popupVisible,
  promptPopupVisible,
  setPopupVisible,
  setPromptPopupVisible,
  onChange,
}: Props) => {
  const { performDirectAIAction, loadingDirectAIAction } = useSyntheticGeneration()

  const onDirectActionClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, action: DirectActionTypeEnum) => {
      e.preventDefault() // Prevent focus shift

      const res = await performDirectAIAction({ text: wholeText, selection: selectedText, action })
      onChange && res && onChange(wholeText.replace(selectedText, res))
      setPopupVisible(false)
    },
    [onChange, performDirectAIAction, selectedText, setPopupVisible, wholeText],
  )

  return (
    <>
      {popupVisible ? (
        <div
          style={{
            top: popupPosition.top + 10,
            left: popupPosition.left + 10,
          }}
          className={classes.popoverContainer}
        >
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
          {/* <IconButton
            className={classes.iconButton}
            kind={'ghost'}
            label={'Custom prompt'}
            onMouseDown={(e) => {
              setPopupVisible(false)
              setPromptPopupVisible(true)
              e.preventDefault()
            }}
          >
            <AiLabel />
          </IconButton> */}
        </div>
      ) : promptPopupVisible ? (
        <PromptPopup
          popupPosition={popupPosition}
          selectedText={selectedText}
          wholeText={wholeText}
          onChange={onChange}
          promptPopupVisible={promptPopupVisible}
          setPromptPopupVisible={setPromptPopupVisible}
        />
      ) : null}
    </>
  )
}
