import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, InlineLoading, TextArea } from '@carbon/react'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { post } from '@utils/fetchUtils'

import { EvaluateButton } from './EvaluateButton'
import { EvaluationCriteria } from './EvaluationCriteria'
import { EvaluationResults } from './EvaluationResults'
import { Responses } from './Responses'
import { FetchedResults, Result, Rubric } from './types'

export const SingleExampleEvaluation = () => {
  const [isEvaluationCriteriaCollapsed, setIsEvaluationCriteriaCollapsed] = useState(false)

  const [context, setContext] = useState('How is the weather there?')
  const [responses, setResponses] = useState([
    'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
  ])

  const [rubric, setRubric] = useState<Rubric>({
    title: 'Temperature',
    criteria: 'Is temperature described in both Fahrenheit and Celsius?',
    options: [
      {
        option: 'Yes',
        description: 'The temperature is described in both Fahrenheit and Celsius.',
      },
      {
        option: 'No',
        description: 'The temperature is described either in Fahrenheit or Celsius but not both.',
      },
      {
        option: 'None',
        description: 'A numerical temperature is not mentioned.',
      },
    ],
  })

  const [results, setResults] = useState<Result[] | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<Error | null>(null)

  const [evaluationRunning, setEvaluationRunning] = useState(false)

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

  return (
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
  )
}
