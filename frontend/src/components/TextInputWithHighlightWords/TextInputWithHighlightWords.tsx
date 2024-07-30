import cx from 'classnames'

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'

import { TextInputProps } from '@carbon/react/lib/components/TextInput/TextInput'

import classes from './TextInputWithHighlightWords.module.scss'

export const TextInputWithHighlightWords = ({
  value,
  labelText,
  onChange,
  wordList,
  className,
}: TextInputProps & { wordList: string[] }) => {
  const contentEditableRef = useRef<HTMLInputElement | null>(null)
  const [parsedInputArray, setParsedInputArray] = useState<{ content: string; matches: boolean }[]>([])

  const updateParsedInputArray = useCallback(
    (value: string) => {
      let alphanumericRegex = /([a-zA-Z0-9]+|[^a-zA-Z0-9]+)/g
      let match
      const initialParsedInputArray: { content: string; matches: boolean }[] = []
      while ((match = alphanumericRegex.exec(value as string)) !== null) {
        let isAlphanumeric = /^[a-zA-Z0-9]+$/.test(match[0])

        initialParsedInputArray.push({
          content: match[0],
          matches: isAlphanumeric && wordList.includes(match[0]),
        })
      }
      setParsedInputArray(initialParsedInputArray)
    },
    [wordList],
  )

  const _onChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(event)
  }

  useEffect(() => {
    updateParsedInputArray(value as string)
  }, [updateParsedInputArray, value])

  return (
    <div className={cx('cds--form-item', 'cds--text-input-wrapper', className)}>
      <div className="cds--text-input__label-wrapper">
        <label htmlFor="text-area-evaluation-instruction" className="cds--label">
          {labelText}
        </label>
      </div>
      <div className="cds--text-input__field-outer-wrapper">
        <div className="cds--text-input__field-wrapper">
          <div className={cx(classes.layout)}>
            <input
              id="text-area-evaluation-instruction"
              onChange={_onChange}
              value={value}
              className={cx(classes.hiddenTextArea, 'cds--text-input')}
              ref={contentEditableRef}
            />
            <div className={cx('cds--text-input', classes.displayedTextArea)}>
              {parsedInputArray.map((inputPortion, i) => (
                <span
                  key={i}
                  className={cx({
                    [classes.matchColor]: inputPortion.matches,
                    [classes.primaryColor]: !inputPortion.matches,
                  })}
                >
                  {inputPortion.content}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
