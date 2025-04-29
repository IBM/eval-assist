import cx from 'classnames'
import debounce from 'lodash/debounce'

import { ComponentProps, forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { fast01 } from '@carbon/motion'
import { TextArea } from '@carbon/react'

import { DirectActionPopup } from '@components/DirectActionPopup/DirectActionPopup'
import { useMousePosition } from '@customHooks/useMousePosition'
import { useMergeRefs } from '@floating-ui/react'

import classes from './FlexTextArea.module.scss'

type Props = {
  maxInactiveHeight?: number
  fixMaxHeight?: boolean
} & ComponentProps<typeof TextArea>

export const FlexTextArea = forwardRef<HTMLTextAreaElement, Props>(function FlexTextArea(
  { helperText, className, maxInactiveHeight = 125, onBlur, fixMaxHeight, ...props },
  outsideRef,
) {
  const [popupVisible, setPopupVisible] = useState<boolean>(false)
  const [promptPopupVisible, setPromptPopupVisible] = useState<boolean>(false)

  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState<string>('')
  const [isFocused, setFocused] = useState(false)

  const setFocusedDebounce = useCallback(
    // The multiplier is here because JS execution is delayed compared to the CSS transitions
    debounce(setFocused, HEIGHT_ANIMATION_DURATION * 1.5),
    [],
  )

  const sizerRef = useRef<HTMLTextAreaElement>(null)
  const innerRef = useRef<HTMLTextAreaElement>(null)

  const ref = useMergeRefs([outsideRef, innerRef])
  const { x, y } = useMousePosition()

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const textarea = innerRef.current
      if (!textarea) return

      const selectionStart = textarea.selectionStart
      const selectionEnd = textarea.selectionEnd
      const text = textarea.value.substring(selectionStart, selectionEnd)
      if (text) {
        const top = y || 0
        const left = x || 0

        setSelectedText(text)
        setPopupPosition({ top, left })
        setPopupVisible(true)
      } else {
        setPopupVisible(false)
      }
    },
    [x, y],
  )

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
        // newHeight = `${Math.min(sizerEl.scrollHeight, maxInactiveHeight)}px`
        newHeight = `${maxInactiveHeight}px`
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
        onBlur={() => {
          setPopupVisible(false)
          setPromptPopupVisible(false)
        }}
      >
        <div className={classes.textAreaWrapper}>
          <TextArea
            {...props}
            onMouseUp={handleMouseUp}
            ref={ref}
            className={classes.textArea}
            onFocus={() => {
              setFocused(true)
            }}
            onBlur={(e) => {
              !popupVisible && setFocused(false)
            }}
          />
          {/* Sizer element to get ideal textarea height, it is the same
          component type to eliminate mismatch in style (dimensions) */}
          <TextArea className={classes.sizer} value={props.value} ref={sizerRef} tabIndex={-1} labelText="" />
          {x !== null && y !== null && (
            <DirectActionPopup
              popupVisible={popupVisible}
              selectedText={selectedText}
              wholeText={(props.value as string) || ''}
              popupPosition={popupPosition}
              promptPopupVisible={promptPopupVisible}
              setPromptPopupVisible={setPromptPopupVisible}
              onChange={(newValue: string) =>
                props.onChange &&
                props.onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>)
              }
              setPopupVisible={setPopupVisible}
            />
          )}
        </div>
      </div>
    </>
  )
})

const HEIGHT_ANIMATION_DURATION = parseInt(fast01)
