import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, IconButton, TextArea } from '@carbon/react'
import { Add, Close } from '@carbon/react/icons'

interface ResponsesInterface {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
  className?: string
}

export const Responses = ({ responses, setResponses, style, className }: ResponsesInterface) => {
  const onRemoveResponse = (i: number) => {
    if (responses.length === 1) return
    setResponses(responses.filter((_, j) => i !== j))
  }

  return (
    <div style={style} className={className}>
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
            <IconButton
              disabled={responses.length === 1}
              kind={'ghost'}
              size="sm"
              label="Delete"
              align="bottom"
              onClick={() => onRemoveResponse(i)}
            >
              <Close size={14} />
            </IconButton>
          </div>
          <TextArea
            onChange={(e) => setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])}
            rows={4}
            value={response}
            id="text-area-model-output"
            labelText={''}
            placeholder="The response/text to evaluate."
          />
        </div>
      ))}
      <Button
        kind="tertiary"
        size="sm"
        renderIcon={Add}
        style={{ marginTop: '1rem' }}
        onClick={(e) => setResponses([...responses, ''])}
      >
        {'Add response'}
      </Button>
    </div>
  )
}
