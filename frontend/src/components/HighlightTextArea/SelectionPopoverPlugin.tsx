import { $getSelection, $isRangeSelection } from 'lexical'

import { useCallback, useEffect, useState } from 'react'

import { IconButton, Popover, PopoverContent } from '@carbon/react'
import { AiLabel, Rotate, Save, TextLongParagraph, TextShortParagraph } from '@carbon/react/icons'

import { DirectAIActionPopup } from '@components/DirectAIActionPopup'
import { useCurrentTestCase } from '@components/SingleExampleEvaluation/Providers/CurrentTestCaseProvider'
import { useSyntheticGeneration } from '@components/SingleExampleEvaluation/Providers/SyntheticGenerationProvider'
import { DirectActionTypeEnum } from '@constants'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEditorsContext } from './EditorProvider'
import classes from './SelectionPopoverPlugin.module.scss'

interface PopoverState {
  show: boolean
  rect: DOMRect | null
  text: string
  selection: string
}

interface Props {}

export default function SelectionPopoverPlugin({}: Props): JSX.Element | null {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { performDirectAIAction } = useSyntheticGeneration()
  const [editor] = useLexicalComposerContext()
  const [popoverState, setPopoverState] = useState<PopoverState>({
    show: false,
    rect: null,
    text: '',
    selection: '',
  })

  useEffect(() => {
    const handleMouseUp = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          const domSelection = window.getSelection()
          if (domSelection && domSelection.rangeCount > 0) {
            const domRange = domSelection.getRangeAt(0)
            const rect = domRange.getBoundingClientRect()
            const selection = domSelection.toString()
            const rootNode = editor.getEditorState().read(() => editor.getRootElement())
            const text = rootNode?.textContent || ''

            setPopoverState({
              show: true,
              rect,
              selection,
              text,
            })
          }
        } else {
          setPopoverState({
            show: false,
            rect: null,
            text: '',
            selection: '',
          })
        }
      })
    }

    const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement) {
        prevRootElement.removeEventListener('mouseup', handleMouseUp)
      }
      if (rootElement) {
        rootElement.addEventListener('mouseup', handleMouseUp)
      }
    })

    return () => {
      removeRootListener()
    }
  }, [editor])

  const onRephrase = useCallback(async () => {
    const res = await performDirectAIAction({
      text: popoverState.text,
      selection: popoverState.selection,
      action: DirectActionTypeEnum.Elaborate,
    })
    setCurrentTestCase({
      ...currentTestCase,
      criteria: {
        ...currentTestCase.criteria,
        description: currentTestCase.criteria.description.replace(popoverState.selection, res),
      },
    })
    setPopoverState({
      show: false,
      rect: null,
      text: '',
      selection: '',
    })
  }, [currentTestCase, performDirectAIAction, popoverState.selection, popoverState.text, setCurrentTestCase])

  if (!popoverState.show || !popoverState.rect) return null
  const { top, left } = popoverState.rect
  return (
    <Popover
      open={true}
      align="bottom-end"
      isTabTip
      style={{
        position: 'absolute',
        top: top + window.scrollY - 385,
        left: left + window.scrollX - 250,
      }}
    >
      <PopoverContent className={classes.popoverContainer}>
        <div style={{ display: 'flex', flexDirection: 'row' }} className={classes.popoverContainer}>
          <IconButton className={classes.iconButton} kind={'ghost'} label={'Rephrase'} onClick={onRephrase}>
            <Rotate />
          </IconButton>
          <IconButton className={classes.iconButton} kind={'ghost'} label={'Longer'}>
            <TextLongParagraph />
          </IconButton>
          <IconButton className={classes.iconButton} kind={'ghost'} label={'Shorter'}>
            <TextShortParagraph />
          </IconButton>
          <IconButton className={classes.iconButton} kind={'ghost'} label={'Custom prompt'}>
            <AiLabel />
          </IconButton>
        </div>
      </PopoverContent>
    </Popover>
  )
}
