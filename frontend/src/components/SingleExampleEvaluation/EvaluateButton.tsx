import { CSSProperties } from 'react'

import { Button, InlineLoading } from '@carbon/react'

import classes from './SingleExampleEvaluation.module.scss'

interface EvaluateButtonProps {
  evaluationRunning: boolean
  runEvaluation: () => Promise<void>
  style?: CSSProperties
  className?: string
  bamAPIKey: string
}

export const EvaluateButton = ({
  evaluationRunning,
  bamAPIKey,
  runEvaluation,
  style,
  className,
}: EvaluateButtonProps) => {
  return (
    <div style={style} className={className}>
      {evaluationRunning ? (
        <InlineLoading description={'Running evaluation...'} status={'active'} className={classes['loading-wrapper']} />
      ) : (
        <Button onClick={runEvaluation} disabled={evaluationRunning || bamAPIKey === ''}>
          Evaluate
        </Button>
      )}
    </div>
  )
}
