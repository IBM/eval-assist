import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, IconButton, TextArea } from '@carbon/react'
import { Close } from '@carbon/react/icons'

interface ResponsesInterface {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
}

export const Responses = ({ responses, setResponses, style }: ResponsesInterface) => {
  const onRemoveResponse = (i: number) => {
    setResponses(responses.filter((_, j) => i !== j))
  }

  return (
    <div style={style}>
      {responses?.map((response, i) => (
        <div key={i} style={{ marginBottom: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
              alignItems: 'center',
            }}
          >
            <label className="cds--label" style={{ marginBottom: 0 }}>{`Response #${i + 1}`}</label>
            <IconButton kind={'ghost'} size="sm" label="Delete" align="bottom" onClick={() => onRemoveResponse(i)}>
              <Close size={14} />
            </IconButton>
          </div>
          <TextArea
            onChange={(e) => setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])}
            rows={4}
            value={response}
            id="text-area-model-output"
            labelText={''}
          />
        </div>
      ))}
      <Button kind="tertiary" style={{ marginTop: '1rem' }} onClick={(e) => setResponses([...responses, ''])}>
        {'Add response'}
      </Button>
    </div>
  )
}
