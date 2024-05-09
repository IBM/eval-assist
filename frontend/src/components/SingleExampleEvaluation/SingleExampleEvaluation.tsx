import { useLocalStorage } from 'usehooks-ts'

import { LegacyRef, useMemo, useRef, useState } from 'react'

import { Content, TextArea } from '@carbon/react'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { AppHeader } from '@components/AppHeader/AppHeader'
import { useAuthentication } from '@customHooks/useAuthentication'
import { StoredUseCase } from '@prisma/client'
import { post, put } from '@utils/fetchUtils'
import { getEmptyRubric, parseFetchedUseCase } from '@utils/utils'

import { APIKeyPopover } from './APIKeyPopover'
import { EvaluateButton } from './EvaluateButton'
import { EvaluationCriteria } from './EvaluationCriteria'
import { EvaluationResults } from './EvaluationResults'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { SaveTestCaseModal } from './Modals/SaveTestCaseModal'
import { UseCaseConfirmationModal } from './Modals/UseCaseConfimationModal'
import { Responses } from './Responses'
import { TestCaseOptions } from './UseCaseOptions'
import { FetchedResults, Result, Rubric, UseCase } from './types'

export interface SingleExampleEvaluationProps {
  _userUseCases: UseCase[]
}

export const SingleExampleEvaluation = ({ _userUseCases }: SingleExampleEvaluationProps) => {
  // we are ignoring client side rendering to be able to use useSessionStorage
  const [libraryUseCaseSelected, setLibraryUseCaseSelected] = useState<UseCase | null>(null)

  // if the usecase doesnt have an id, it means it hasn't been stored
  const [id, setId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [responses, setResponses] = useState([''])
  const [rubric, setRubric] = useState<Rubric>(getEmptyRubric())

  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false)
  const [userUseCases, setUserUseCases] = useState(_userUseCases)

  const isUseCaseSaved = useMemo(() => id !== null, [id])
  const [results, setResults] = useState<Result[] | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string>('')

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveTestCaseModalOpen, setSaveTestCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)

  const [popoverOpen, setPopoverOpen] = useState(false)

  // useBeforeOnload()

  const [bamAPIKey, setBamAPIKey, removeBamAPIKey] = useLocalStorage<string>('bamAPIKey', '')

  const popoverRef = useRef<HTMLDivElement>()

  const { getUserName } = useAuthentication()

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate/', {
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
    setName(useCase.id !== null ? useCase.name : '')
    setId(useCase.id)
    setResults(useCase.results)
  }

  const onSave = async () => {
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name,
          content: JSON.stringify({
            context,
            responses,
            rubric,
            results,
          }),
          user_id: -1,
          id: id,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)
    setUseCase(parsedSavedUseCase)

    // update use case in the use cases list
    const i = userUseCases.findIndex((useCase) => useCase.id === id)
    setUserUseCases([...userUseCases.slice(0, i), parsedSavedUseCase, ...userUseCases.slice(i + 1)])
    // notify the user
  }

  const onSaveAs = async () => {
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name,
          content: JSON.stringify({
            context,
            responses,
            rubric,
            results,
          }),
          user_id: -1,
          id: -1,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)
    setUseCase(parsedSavedUseCase)
    setUserUseCases([...userUseCases, parsedSavedUseCase])
    // notify the user
  }

  return (
    <>
      <AppHeader
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setLibraryUseCaseSelected}
        userUseCases={userUseCases}
        isSideNavExpanded={isSideNavExpanded}
        setIsSideNavExpanded={setIsSideNavExpanded}
        currentUseCaseId={id}
        displaySidenav
      />
      <Content style={{ paddingLeft: 0, paddingTop: 0 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            paddingTop: '1rem',
            marginBottom: '1rem',
          }}
          ref={popoverRef as LegacyRef<HTMLDivElement> | undefined}
          className={`${classes['bottom-divider']} ${classes['left-padding']}`}
        >
          <h3>Evaluation sandbox</h3>

          <APIKeyPopover
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
            bamAPIKey={bamAPIKey}
            setBamAPIKey={setBamAPIKey}
          />
        </div>
        <TestCaseOptions
          style={{ marginBottom: '1rem' }}
          className={classes['left-padding']}
          testCaseName={name}
          setTestCaseName={setName}
          setSaveTestCaseModalOpen={setSaveTestCaseModalOpen}
          isTestCaseSaved={isUseCaseSaved}
          onSave={onSave}
          setNewUseCaseModalOpen={setNewUseCaseModalOpen}
        />
        <EvaluationCriteria
          className={classes['left-padding']}
          rubric={rubric}
          setRubric={setRubric}
          style={{ marginBottom: '1rem' }}
        />
        <div style={{ marginBottom: '1rem' }} className={`${classes['left-padding']} cds--accordion-title`}>
          Test data
        </div>
        <TextArea
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          value={context}
          id="text-area-context"
          labelText="Task context (optional)"
          style={{ marginBottom: '1rem' }}
          placeholder="Context information relevant to the evaluation such as prompt, data variables etc."
          className={classes['left-padding']}
        />

        <Responses
          responses={responses}
          setResponses={setResponses}
          style={{ marginBottom: '2rem' }}
          className={classes['left-padding']}
        />

        <EvaluateButton
          evaluationRunning={evaluationRunning}
          runEvaluation={runEvaluation}
          style={{ marginBottom: '1rem' }}
          className={classes['left-padding']}
        />
        {bamAPIKey === '' && !evaluationRunning && results === null && !evaluationFailed && (
          <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
            {'You will need to provide your BAM API key to run the evaluation'}
          </p>
        )}
        <EvaluationResults
          className={classes['left-padding']}
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
        libraryUseCaseSelected={libraryUseCaseSelected}
        setIsSideNavExpanded={setIsSideNavExpanded}
      />
      <SaveTestCaseModal
        open={saveTestCaseModalOpen}
        setOpen={setSaveTestCaseModalOpen}
        onSaveAs={onSaveAs}
        testCaseName={name}
        setTestCaseName={setName}
      />
      <NewUseCaseModal open={newUseCaseModalOpen} setOpen={setNewUseCaseModalOpen} setUseCase={setUseCase} />
    </>
  )
}
