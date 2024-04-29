import { use, useState } from 'react'

import { Content, TextArea } from '@carbon/react'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { ConfirmationDialog } from '@components/LandingPage/ConfirmationDialog'
import { post } from '@utils/fetchUtils'

import { EvaluateButton } from './EvaluateButton'
import { EvaluationCriteria } from './EvaluationCriteria'
import { EvaluationResults } from './EvaluationResults'
import { Responses } from './Responses'
import { UseCaseConfirmationModal } from './UseCaseConfimationModal'
import { UseCase } from './UseCases'
import { FetchedResults, Result, Rubric } from './types'

export const SingleExampleEvaluation = () => {
  const [context, setContext] = useState('')
  const [responses, setResponses] = useState([''])

  const [rubric, setRubric] = useState<Rubric>({
    title: '',
    criteria: '',
    options: [
      {
        option: '',
        description: '.',
      },
    ],
  })

  const [results, setResults] = useState<Result[] | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<Error | null>(null)

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [useCaseSelected, setUseCaseSelected] = useState<UseCase | null>(null)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate', {
      context,
      responses,
      rubric,
    })

    setEvaluationRunning(false)

    if (response.status === 500) {
      setEvaluationFailed(true)
      setEvaluationError(new Error('Something went wrong running the evaluation. Please try again.'))
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

  return (
    <>
      <AppHeader setOpen={setConfirmationModalOpen} setUseCaseSelected={setUseCaseSelected} />
      <Content style={{ paddingLeft: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Evaluation sandbox</h3>
          <TextArea
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            value={context}
            id="text-area-context"
            labelText="Task context (optional)"
            style={{ marginBottom: '1rem' }}
          />
          <Responses responses={responses} setResponses={setResponses} style={{ marginBottom: '2rem' }} />
          <EvaluationCriteria rubric={rubric} setRubric={setRubric} style={{ marginBottom: '2rem' }} />
          <EvaluateButton
            evaluationRunning={evaluationRunning}
            runEvaluation={runEvaluation}
            style={{ marginBottom: '1rem' }}
          />

          <EvaluationResults
            results={results}
            evaluationFailed={evaluationFailed}
            evaluationError={evaluationError}
            evaluationRunning={evaluationRunning}
            style={{ marginBottom: '1rem' }}
          />
        </div>
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
