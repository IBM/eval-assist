import { CSSProperties } from 'react'

import { Button, InlineLoading } from '@carbon/react'
import classes from '@styles/SingleExampleEvaluation.module.scss'

interface EvaluateButtonProps {
  evaluationRunning: boolean
  runEvaluation: () => Promise<void>
  style?: CSSProperties
}

export const EvaluateButton = ({ evaluationRunning, runEvaluation, style }: EvaluateButtonProps) => {
  return (
    <div style={style}>
      {evaluationRunning ? (
        <InlineLoading description={'Running evaluation...'} status={'active'} className={classes['loading-wrapper']} />
      ) : (
        <Button onClick={runEvaluation} disabled={evaluationRunning}>
          Evaluate
        </Button>
      )}
    </div>
  )
}
