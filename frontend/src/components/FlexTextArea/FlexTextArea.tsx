import cx from 'classnames'
import debounce from 'lodash/debounce'

import { ComponentProps, forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { fast01 } from '@carbon/motion'
import { TextArea } from '@carbon/react'

import { useMergeRefs } from '@floating-ui/react'

import classes from './FlexTextArea.module.scss'

type Props = {
  maxInactiveHeight?: number
  fixMaxHeight?: boolean
} & ComponentProps<typeof TextArea>

export const FlexTextArea = forwardRef<HTMLTextAreaElement, Props>(function FlexTextArea(
  { helperText, className, maxInactiveHeight = 120, onBlur, fixMaxHeight, ...props },
  outsideRef,
) {
  const [isFocused, setFocused] = useState(false)
  const setFocusedDebounce = useCallback(
    // The multiplier is here because JS execution is delayed compared to the CSS transitions
    debounce(setFocused, HEIGHT_ANIMATION_DURATION * 1.5),
    [],
  )

  const sizerRef = useRef<HTMLTextAreaElement>(null)
  const innerRef = useRef<HTMLTextAreaElement>(null)

  const ref = useMergeRefs([outsideRef, innerRef])

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
    <div className={cx(className, classes.flex)}>
      <div className={classes.textAreaWrapper}>
        <TextArea
          {...props}
          ref={ref}
          className={classes.textArea}
          onFocus={() => {
            setFocused(true)
            setFocusedDebounce(true) // Debounce must be also cleared
          }}
          onBlur={(e) => {
            onBlur?.(e)
            setFocusedDebounce(false)
          }}
        />
        {/* Sizer element to get ideal textarea height, it is the same
          component type to eliminate mismatch in style (dimensions) */}
        <TextArea className={classes.sizer} value={props.value} ref={sizerRef} tabIndex={-1} labelText="" />
      </div>
    </div>
  )
})

const HEIGHT_ANIMATION_DURATION = parseInt(fast01)
