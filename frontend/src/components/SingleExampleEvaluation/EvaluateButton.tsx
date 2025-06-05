import { modelProviderBeautifiedName } from 'src/constants'

import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button, IconButton, InlineLoading, Tooltip } from '@carbon/react'
import { Stop, Warning } from '@carbon/react/icons'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'
import { ModelProviderType } from '@types'

import classes from './EvaluateButton.module.scss'

interface EvaluateButtonProps {
  style?: CSSProperties
  className?: string
}

export const EvaluateButton = ({ style, className }: EvaluateButtonProps) => {
  const { isRisksAndHarms } = useURLParamsContext()
  const { currentTestCase, areRelevantCredentialsProvided, outdatedResultInstanceIds } = useCurrentTestCase()
  const { runEvaluation, evaluationFailed, evaluationRunning, cancelEvaluation } = useTestCaseActionsContext()
  const { setPromptModalOpen } = useModalsContext()

  return (
    <div style={style} className={className}>
      {evaluationRunning ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '0.5rem',
            justifyContent: 'flex-start',
          }}
        >
          <InlineLoading description={'Running evaluation...'} status={'active'} className={classes.loadingWrapper} />
          <IconButton kind={'ghost'} label={'Cancel evaluation'} onMouseDown={cancelEvaluation}>
            <Stop />
          </IconButton>
        </div>
      ) : (
        <div>
          {!areRelevantCredentialsProvided && !evaluationRunning && !evaluationFailed ? (
            <Tooltip
              label={
                <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
                  {!currentTestCase?.evaluator
                    ? `No evaluator was selected`
                    : `You need to provide the '${
                        modelProviderBeautifiedName[currentTestCase.evaluator.provider as ModelProviderType]
                      }' credentials in order to run evaluations`}
                </p>
              }
            >
              <span>
                <Button
                  onClick={() => runEvaluation(outdatedResultInstanceIds)}
                  disabled={evaluationRunning || !areRelevantCredentialsProvided}
                  renderIcon={Warning}
                >
                  Evaluate
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              onClick={() => runEvaluation(outdatedResultInstanceIds)}
              disabled={evaluationRunning || !areRelevantCredentialsProvided}
            >
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
