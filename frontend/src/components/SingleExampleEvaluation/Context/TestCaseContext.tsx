import { SetStateAction } from 'react'

import { ResponsiveTextArea } from '@components/ResponsiveTextArea/ResponsiveTextArea'

import classes from '../SingleExampleEvaluation.module.scss'

interface Props {
  context: string
  setContext: (value: SetStateAction<string>) => void
}

export const TestCaseContext = ({ context, setContext }: Props) => {
  return (
    <ResponsiveTextArea
      onChange={(e) => {
        setContext(e.target.value)
      }}
      rows={1}
      value={context}
      id="text-area-context"
      labelText="Task context (optional)"
      style={{ marginBottom: '1.5rem', resize: 'none' }}
      placeholder="Context information relevant to the evaluation such as prompt, data variables etc."
      className={classes['left-padding']}
    />
  )
}
