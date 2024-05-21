import { CSSProperties, Dispatch, SetStateAction, useCallback } from 'react'

import { CopyButton, IconButton, Layer, TextArea } from '@carbon/react'
import { TextAlignLeft } from '@carbon/react/icons'

interface JSONTextAreaInterface {
  rawJSONCriteria: string
  setRawJSONCriteria: Dispatch<SetStateAction<string>>
  isValidRawJSONCriteria: (str: string) => boolean
  style?: CSSProperties
  rowCount: number
}

export const JSONTextArea = ({
  rawJSONCriteria,
  setRawJSONCriteria,
  isValidRawJSONCriteria,
  style,
  rowCount,
}: JSONTextAreaInterface) => {
  const onRawJSONCriteriaChange = useCallback(
    (e: { target: { value: string } }) => {
      setRawJSONCriteria(e.target.value)
    },
    [setRawJSONCriteria],
  )

  const onFormatClick = () => {
    setRawJSONCriteria(JSON.stringify(JSON.parse(rawJSONCriteria), null, 4))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawJSONCriteria)
  }

  return (
    <div style={style}>
      <Layer style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="cds--label" style={{ marginBottom: 0 }}>
            Json Input
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <CopyButton onClick={copyToClipboard} />
            <IconButton kind="ghost" label={'Format'} align="bottom" onClick={onFormatClick}>
              <TextAlignLeft />
            </IconButton>
          </div>
        </div>
        <TextArea
          labelText={''}
          value={rawJSONCriteria}
          onChange={onRawJSONCriteriaChange}
          id="text-input-json-raw"
          placeholder="Input evaluation criteria in json format"
          rows={rowCount}
          invalid={!isValidRawJSONCriteria(rawJSONCriteria)}
          invalidText={'JSON input is invalid'}
          // style={{ backgroundColor: 'white' }}
        />
      </Layer>
    </div>
  )
}
