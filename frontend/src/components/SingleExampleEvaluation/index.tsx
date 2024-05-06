import { useSessionStorage } from 'usehooks-ts'

import { LegacyRef, useRef, useState } from 'react'

import { Content, TextArea } from '@carbon/react'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { useHasMounted } from '@customHooks/useHasMounted'
import { post } from '@utils/fetchUtils'

import { APIKeyPopover } from './APIKeyPopover'
import { EvaluateButton } from './EvaluateButton'
import { EvaluationCriteria } from './EvaluationCriteria'
import { EvaluationResults } from './EvaluationResults'
import { Responses } from './Responses'
import { UseCaseConfirmationModal } from './UseCaseConfimationModal'
import { UseCase } from './UseCases'
import { FetchedResults, Result, Rubric } from './types'

export const SingleExampleEvaluation = () => {
  // we are ignoring client side rendering to be able to use useSessionStorage
  const hasMounted = useHasMounted()

  const [context, setContext] = useState('')
  const [responses, setResponses] = useState([''])

  const [rubric, setRubric] = useState<Rubric>({
    title: '',
    criteria: '',
    options: [
      {
        option: '',
        description: '',
      },
      {
        option: '',
        description: '',
      },
    ],
  })

  const [results, setResults] = useState<Result[] | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string>('')

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [useCaseSelected, setUseCaseSelected] = useState<UseCase | null>(null)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)

  const [popoverOpen, setPopoverOpen] = useState(false)

  const [bamAPIKey, setBamAPIKey, removeBamAPIKey] = useSessionStorage<string>('bamAPIKey', '')

  const popoverRef = useRef<HTMLDivElement>()

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate', {
      context,
      responses,
      rubric,
      bam_api_key: bamAPIKey,
    })

    setEvaluationRunning(false)

    if (!response.ok) {
      const error = (await response.json()) as {
        detail: string
      }
      console.log(error)
      setEvaluationFailed(true)
      // We are catching this error an so we show the message sent from the backend
      setEvaluationError(error.detail)
      return
    }

    const responseBody = (await response.json()) as FetchedResults

    setResults(
      responseBody.results.map((result) => ({
        name: rubric.title,
        option: result.option,
        explanation: result.explanation,
        positionalBias: result.p_bias,
      })),
    )
  }

  const setUseCase = (useCase: UseCase) => {
    setContext(useCase.context)
    setResponses(useCase.responses)
    setRubric(useCase.rubric)
  }

  if (!hasMounted) return null

  return (
    <>
      <AppHeader setOpen={setConfirmationModalOpen} setUseCaseSelected={setUseCaseSelected} />
      <Content style={{ paddingLeft: '1rem' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
          ref={popoverRef as LegacyRef<HTMLDivElement> | undefined}
        >
          <h3 style={{ marginBottom: '1rem' }}>Evaluation sandbox</h3>

          <APIKeyPopover
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
            bamAPIKey={bamAPIKey}
            setBamAPIKey={setBamAPIKey}
          />
        </div>

        <EvaluationCriteria rubric={rubric} setRubric={setRubric} style={{ marginBottom: '2rem' }} />

        <TextArea
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          value={context}
          id="text-area-context"
          labelText="Task context (optional)"
          style={{ marginBottom: '1rem' }}
          placeholder="Context information relevant to the evaluation such as prompt, data variables etc."
        />

        <Responses responses={responses} setResponses={setResponses} style={{ marginBottom: '2rem' }} />

        <EvaluateButton
          evaluationRunning={evaluationRunning}
          runEvaluation={runEvaluation}
          style={{ marginBottom: '1rem' }}
        />
        {bamAPIKey === '' && !evaluationRunning && results === null && !evaluationFailed && (
          <p>{'You will need to provide your BAM API key to run the evaluation'}</p>
        )}

        <EvaluationResults
          results={results}
          evaluationFailed={evaluationFailed}
          evaluationError={evaluationError}
          evaluationRunning={evaluationRunning}
          style={{ marginBottom: '1rem' }}
        />
      </Content>
      <UseCaseConfirmationModal
        setUseCase={setUseCase}
        open={confirmationModalOpen}
        setOpen={setConfirmationModalOpen}
        useCaseSelected={useCaseSelected}
      />
    </>
  )
}
