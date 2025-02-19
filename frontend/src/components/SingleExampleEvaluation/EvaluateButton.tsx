import { modelProviderBeautifiedName } from 'src/constants'

import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, InlineLoading, Tooltip } from '@carbon/react'
import { Warning } from '@carbon/react/icons'

import { ModelProviderType } from '@types'

import classes from './EvaluateButton.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface EvaluateButtonProps {
  evaluationRunning: boolean
  runEvaluation: () => Promise<void>
  areRelevantCredentialsProvided: boolean
  setPromptModalOpen: Dispatch<SetStateAction<boolean>>
  style?: CSSProperties
  className?: string
  currentUseCase: any
  evaluationFailed: boolean
}

export const EvaluateButton = ({
  evaluationRunning,
  areRelevantCredentialsProvided,
  runEvaluation,
  setPromptModalOpen,
  currentUseCase,
  evaluationFailed,
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
          {!areRelevantCredentialsProvided && !evaluationRunning && !evaluationFailed ? (
            <Tooltip
              label={
                <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
                  {currentUseCase.evaluator === null
                    ? `No evaluator was selected`
                    : `You need to provide the '${
                        modelProviderBeautifiedName[currentUseCase.evaluator?.provider as ModelProviderType]
                      }' credentials in order to run evaluations`}
                </p>
              }
            >
              <span>
                <Button
                  onClick={runEvaluation}
                  disabled={evaluationRunning || !areRelevantCredentialsProvided}
                  renderIcon={Warning}
                >
                  Evaluate
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button onClick={runEvaluation} disabled={evaluationRunning || !areRelevantCredentialsProvided}>
              Evaluate
            </Button>
          )}
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
