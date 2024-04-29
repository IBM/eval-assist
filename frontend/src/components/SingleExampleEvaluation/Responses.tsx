import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, TextArea } from '@carbon/react'

interface ResponsesInterface {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
}

export const Responses = ({ responses, setResponses, style }: ResponsesInterface) => {
  return (
    <div style={style}>
      {responses?.map((response, i) => (
        <TextArea
          onChange={(e) => setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])}
          rows={4}
          value={response}
          id="text-area-model-output"
          labelText={`Response #${i + 1}`}
          style={{ marginBottom: '1rem' }}
          key={i}
        />
      ))}
      <Button kind="tertiary" onClick={(e) => setResponses([...responses, ''])}>
        {'Add response'}
      </Button>
    </div>
  )
}
