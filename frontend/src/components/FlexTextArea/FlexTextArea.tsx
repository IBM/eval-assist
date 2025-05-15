import cx from 'classnames'
import debounce from 'lodash/debounce'

import { ComponentProps, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { fast01 } from '@carbon/motion'
import { TextArea } from '@carbon/react'

import { DirectAIActionPopup, DirectAIActionPopupVisibility } from '@components/DirectAIActionPopup'
import { useSelectedTextContext } from '@components/SingleExampleEvaluation/Providers/SelectedTextProvider'
import { useURLParamsContext } from '@components/SingleExampleEvaluation/Providers/URLParamsProvider'
import { useMergeRefs } from '@floating-ui/react'
import { getCaretPosition } from '@utils'

import classes from './FlexTextArea.module.scss'

type Props = {
  maxInactiveHeight?: number
  fixMaxHeight?: boolean
  instanceId: string
  fieldName: string
} & ComponentProps<typeof TextArea>

export const FlexTextArea = forwardRef<HTMLTextAreaElement, Props>(function FlexTextArea(
  { instanceId, fieldName, helperText, className, maxInactiveHeight = 125, onBlur, fixMaxHeight, ...props },
  outsideRef,
) {
  const [popupVisibility, setPopupVisibility] = useState<DirectAIActionPopupVisibility>({
    options: false,
    prompt: false,
    confirmation: false,
  })
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const { selectedText, isMouseUp } = useSelectedTextContext()
  const [generatedText, setGeneratedText] = useState('')
  const { syntheticGenerationEnabled } = useURLParamsContext()
  const [isFocused, setFocused] = useState(false)
  const isPopupOpen = useMemo(() => Object.values(popupVisibility).some((x) => x), [popupVisibility])

  const setFocusedDebounce = useCallback(
    // The multiplier is here because JS execution is delayed compared to the CSS transitions
    debounce(setFocused, HEIGHT_ANIMATION_DURATION * 1.5),
    [],
  )

  const sizerRef = useRef<HTMLTextAreaElement>(null)
  const innerRef = useRef<HTMLTextAreaElement>(null)

  const ref = useMergeRefs([outsideRef, innerRef])

  useEffect(() => {
    const textarea = innerRef.current
    if (!textarea || !selectedText || !isFocused || !isMouseUp) {
      setPopupVisibility({ options: false, prompt: false, confirmation: false })
      return
    }
    const { x, y } = getCaretPosition(textarea)

    if (selectedText || generatedText) {
      setPopupPosition({ top: y + 10, left: x })
    }

    if (generatedText) {
      setPopupVisibility({ options: false, prompt: false, confirmation: true })
    } else {
      setPopupVisibility({ options: true, prompt: false, confirmation: false })
    }
  }, [generatedText, isFocused, isMouseUp, selectedText])

  useEffect(() => {
    if (!fixMaxHeight) {
      const el = innerRef?.current
      if (!el) {
        return
      }

      let isMounted = true
      el.classList.remove('noanimation')
      el.addEventListener(
        'transitionend',
        () => {
          if (isMounted) {
            el.classList.add('noanimation')
          }
        },
        {
          once: true,
        },
      )
    }
  }, [isFocused, fixMaxHeight])

  const updateHeight = useCallback(() => {
    const el = innerRef?.current
    const sizerEl = sizerRef?.current
    if (!el || !sizerEl) {
      return
    }

    if (fixMaxHeight) {
      el.style.height = `${sizerEl.scrollHeight + 2}px`
    } else {
      let newHeight = isFocused ? `${sizerEl.scrollHeight}px` : ''
      if (newHeight == '' && maxInactiveHeight) {
        newHeight = `${Math.min(sizerEl.scrollHeight, maxInactiveHeight)}px`
      }
      if (newHeight !== el.style.height) {
        el.style.height = newHeight
      }
    }
  }, [isFocused, maxInactiveHeight, fixMaxHeight])

  useEffect(() => {
    updateHeight()
  })

  return (
    <>
      <div
        className={cx(className, classes.flex, {
          [classes.flexExpanded]: isFocused,
        })}
        onBlur={() => {}}
      >
        <div className={classes.textAreaWrapper}>
          <TextArea
            {...props}
            ref={ref}
            className={classes.textArea}
            onFocus={() => {
              setFocused(true)
            }}
            onBlur={(e) => {
              setFocused(false)
              // e.stopPropagation()
            }}
          />
          {/* Sizer element to get ideal textarea height, it is the same
          component type to eliminate mismatch in style (dimensions) */}
          <TextArea className={classes.sizer} value={props.value} ref={sizerRef} tabIndex={-1} labelText="" />

          {syntheticGenerationEnabled && (
            <DirectAIActionPopup
              textAreaRef={innerRef}
              wholeText={(props.value as string) || ''}
              popupPosition={popupPosition}
              generatedText={generatedText}
              instanceId={instanceId}
              fieldName={fieldName}
              setGeneratedText={setGeneratedText}
              onChange={(newValue: string) =>
                props.onChange &&
                props.onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>)
              }
              popupVisibility={popupVisibility}
              // setPopupVisibility={setPopupVisibility}
            />
          )}
        </div>
      </div>
    </>
  )
})

const HEIGHT_ANIMATION_DURATION = parseInt(fast01)
