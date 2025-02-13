import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, InlineLoading } from '@carbon/react'

import classes from './EvaluateButton.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface EvaluateButtonProps {
  evaluationRunning: boolean
  runEvaluation: () => Promise<void>
  areRelevantCredentialsProvided: boolean
  setPromptModalOpen: Dispatch<SetStateAction<boolean>>
  style?: CSSProperties
  className?: string
}

export const EvaluateButton = ({
  evaluationRunning,
  areRelevantCredentialsProvided,
  runEvaluation,
  setPromptModalOpen,
  style,
  className,
}: EvaluateButtonProps) => {
  const { isRisksAndHarms } = useURLInfoContext()

  return (
    <div style={style} className={className}>
      {evaluationRunning ? (
        <InlineLoading description={'Running evaluation...'} status={'active'} className={classes.loadingWrapper} />
      ) : (
        <div>
          <Button onClick={runEvaluation} disabled={evaluationRunning || !areRelevantCredentialsProvided}>
            Evaluate
          </Button>
          {isRisksAndHarms && (
            <Button onClick={() => setPromptModalOpen(true)} kind="ghost">
              Show prompt
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
