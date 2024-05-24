import cx from 'classnames'
import { useLocalStorage } from 'usehooks-ts'

import { LegacyRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { TextArea } from '@carbon/react'

import { useToastContext } from '@components/ToastProvider/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { StoredUseCase } from '@prisma/client'
import { deleteCustom, post, put } from '@utils/fetchUtils'
import { getEmptyCriteria, parseFetchedUseCase } from '@utils/utils'

import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { PipelineSelect } from './PipelineSelect'
import { Responses } from './Responses'
import { EvaluationResults } from './Results'
import classes from './SingleExampleEvaluation.module.scss'
import { UseCaseOptions } from './UseCaseOptions'
import { autoUpdateSize, useAutosizeTextArea } from './autosizeTextArea'
import {
  FetchedPairwiseResult,
  FetchedResults,
  FetchedRubricResult,
  PairwiseCriteria,
  PairwiseResult,
  PipelineType,
  RubricCriteria,
  RubricResult,
  UseCase,
} from './types'

export interface SingleExampleEvaluationProps {
  _userUseCases: UseCase[]
  currentUseCase: UseCase | null
}

export const SingleExampleEvaluation = ({ _userUseCases, currentUseCase }: SingleExampleEvaluationProps) => {
  // we are ignoring client side rendering to be able to use useSessionStorage
  const [showingTestCase, setShowingTestCase] = useState<boolean>(currentUseCase !== null)
  const [libraryUseCaseSelected, setLibraryUseCaseSelected] = useState<UseCase | null>(currentUseCase)
  // if the usecase doesnt have an id, it means it hasn't been stored
  const [id, setId] = useState<number | null>(currentUseCase ? currentUseCase.id : null)
  const [name, setName] = useState(currentUseCase ? currentUseCase.name : '')
  const [type, setType] = useState<PipelineType>(currentUseCase ? currentUseCase.type : PipelineType.RUBRIC)
  const [context, setContext] = useState(currentUseCase ? currentUseCase.context : '')
  const [responses, setResponses] = useState(
    currentUseCase ? currentUseCase.responses : type === PipelineType.RUBRIC ? [''] : ['', ''],
  )
  const [criteria, setCriteria] = useState<RubricCriteria | PairwiseCriteria>(
    currentUseCase ? currentUseCase.criteria : getEmptyCriteria(type),
  )
  const [results, setResults] = useState<(RubricResult | PairwiseResult)[] | null>(
    currentUseCase ? currentUseCase.results : null,
  )
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(
    currentUseCase ? currentUseCase.pipeline : null,
  )

  const [userUseCases, setUserUseCases] = useState(_userUseCases)

  const isUseCaseSaved = useMemo(() => id !== null, [id])
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<string>('')

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)

  const [popoverOpen, setPopoverOpen] = useState(false)

  const [sidebarTabSelected, setSidebarTabSelected] = useState<'user_use_cases' | 'library_use_cases' | null>(null)

  const getUseCaseFromState = useCallback(
    (): UseCase => ({
      id,
      name,
      type,
      context,
      responses,
      criteria,
      results,
      pipeline: selectedPipeline,
    }),
    [id, name, type, context, responses, criteria, results, selectedPipeline],
  )

  const [lastSavedUseCaseString, setLastSavedUseCase] = useState<string>(JSON.stringify(getUseCaseFromState()))

  const currentUseCaseString = useMemo<string>(() => {
    return JSON.stringify(getUseCaseFromState())
  }, [getUseCaseFromState])

  const changesDetected = useMemo(
    () => showingTestCase && lastSavedUseCaseString !== currentUseCaseString,
    [showingTestCase, lastSavedUseCaseString, currentUseCaseString],
  )

  const [bamAPIKey, setBamAPIKey, removeBamAPIKey] = useLocalStorage<string>('bamAPIKey', '')

  const popoverRef = useRef<HTMLDivElement>()

  const router = useRouter()

  const { getUserName } = useAuthentication()

  const { addToast } = useToastContext()

  useBeforeOnload(changesDetected)

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    let response
    if (type === PipelineType.RUBRIC) {
      response = await post('evaluate/rubric/', {
        context,
        responses,
        rubric: { criteria: criteria.criteria, options: (criteria as RubricCriteria).options },
        bam_api_key: bamAPIKey,
        pipeline: selectedPipeline,
      })
    } else {
      response = await post('evaluate/pairwise/', {
        instruction: context,
        responses,
        criteria: { name: criteria.name, criteria: criteria.criteria },
        bam_api_key: bamAPIKey,
        pipeline: selectedPipeline,
      })
    }

    setEvaluationRunning(false)

    if (!response.ok) {
      const error = (await response.json()) as {
        detail: string
      }

      // Sometimes, error.detail is an array
      // show a generic message in those cases
      if (typeof error.detail === 'string') {
        setEvaluationError(error.detail)
      } else {
        setEvaluationError(
          `Something went wrong with the evaluation (${(error.detail as { type: string; msg: string }[])[0].type}: ${
            (error.detail as { type: string; msg: string }[])[0].msg
          })`,
        )
      }

      setEvaluationFailed(true)
      // We are catching this error an so we show the message sent from the backend

      addToast({
        kind: 'error',
        title: 'Evaluation failed',
      })

      return
    }

    const responseBody = (await response.json()) as FetchedResults

    addToast({
      kind: 'success',
      title: 'Evaluation finished',
      timeout: 5000,
    })

    let results
    if (type === PipelineType.RUBRIC) {
      results = (responseBody.results as FetchedRubricResult[]).map(
        (result) =>
          ({
            name: criteria.name,
            option: result.option,
            explanation: result.explanation,
            positionalBias: result.p_bias,
            certainty: result.certainty,
          } as RubricResult),
      )
    } else {
      results = (responseBody.results as FetchedPairwiseResult[]).map(
        (result) =>
          ({
            name: criteria.name,
            explanation: result.explanation,
            positionalBias: result.p_bias,
            winnerIndex: result.w_index,
            certainty: result.certainty,
          } as PairwiseResult),
      )
    }

    setResults(results)
  }

  const setCurrentUseCase = (useCase: UseCase) => {
    let urlChangePromise: Promise<boolean>

    if (useCase.id !== null) {
      urlChangePromise = changeUseCaseURL(useCase.id)
    } else {
      urlChangePromise = changeUseCaseURL(null)
    }

    urlChangePromise.then(() => {
      setContext(useCase.context)
      setResponses(useCase.responses)
      setCriteria(useCase.criteria)
      setName(useCase.name)
      setType(useCase.type)
      setId(useCase.id)
      setResults(useCase.results)
      setSelectedPipeline(useCase.pipeline)
      setLastSavedUseCase(JSON.stringify(useCase))
      setShowingTestCase(true)
    })
  }

  const changeUseCaseURL = useCallback(
    (useCaseId: number | null) => {
      if (useCaseId !== null) {
        return router.push({ pathname: '/', query: { id: useCaseId } }, `/?id=${useCaseId}`, {
          shallow: true,
        })
      } else {
        return router.push({ pathname: '/' }, `/`, { shallow: true })
      }
    },
    [router],
  )

  const updateLastSavedPipeline = useCallback(() => {
    setLastSavedUseCase(JSON.stringify(getUseCaseFromState()))
  }, [setLastSavedUseCase, getUseCaseFromState])

  const onSave = async () => {
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name,
          content: JSON.stringify({
            context,
            responses,
            criteria,
            results,
            type,
            pipeline: selectedPipeline,
          }),
          user_id: -1,
          id: id,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)

    // update use case in the use cases list
    const i = userUseCases.findIndex((useCase) => useCase.id === id)
    setUserUseCases([...userUseCases.slice(0, i), parsedSavedUseCase, ...userUseCases.slice(i + 1)])

    // update lastSavedUseCase
    updateLastSavedPipeline()

    // notify the user
    addToast({
      kind: 'success',
      title: `Test case saved`,
      timeout: 5000,
    })
  }

  const onSaveAs = async (name: string, fromUseCase?: UseCase) => {
    const toSaveUseCase = fromUseCase ?? getUseCaseFromState()
    const res = await put('use_case/', {
      use_case: {
        name: name,
        content: JSON.stringify({
          context: toSaveUseCase.context,
          responses: toSaveUseCase.responses,
          criteria: toSaveUseCase.criteria,
          results: toSaveUseCase.results,
          type: toSaveUseCase.type,
          pipeline: toSaveUseCase.pipeline,
        }),
        user_id: -1,
        id: -1,
      } as StoredUseCase,
      user: getUserName(),
    })
    if (!res.ok) {
      const error = (await res.json()) as {
        detail: string
      }
      addToast({
        kind: 'error',
        title: error.detail,
        timeout: 5000,
      })
      return false
    } else {
      const savedUseCase: StoredUseCase = await res.json()
      const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)
      setCurrentUseCase(parsedSavedUseCase)
      setUserUseCases([...userUseCases, parsedSavedUseCase])
      changeUseCaseURL(parsedSavedUseCase.id)
      // update lastSavedUseCase
      setLastSavedUseCase(JSON.stringify(parsedSavedUseCase))

      // notify the user
      addToast({
        kind: 'success',
        title: `Created use case '${parsedSavedUseCase.name}'`,
        timeout: 5000,
      })

      setSidebarTabSelected('user_use_cases')
    }
    return true
  }

  const onDeleteUseCase = async () => {
    await deleteCustom('use_case/', { use_case_id: id })

    // notify the user
    addToast({
      kind: 'success',
      title: `Deleted use case '${name}'`,
      timeout: 5000,
    })

    setUserUseCases(userUseCases.filter((u) => u.id !== id))
    changeUseCaseURL(null)

    setShowingTestCase(false)
  }

  const instructionRef = useRef<HTMLTextAreaElement>(null)
  useAutosizeTextArea([instructionRef.current] as HTMLTextAreaElement[])

  useLayoutEffect(() => {
    function updateSize() {
      autoUpdateSize(instructionRef.current as HTMLTextAreaElement)
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <>
      <AppSidenavNew
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setLibraryUseCaseSelected}
        userUseCases={userUseCases}
        currentUseCaseId={id}
        selected={sidebarTabSelected}
        setSelected={setSidebarTabSelected}
        changesDetected={changesDetected}
        setCurrentUseCase={setCurrentUseCase}
      />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        {!showingTestCase ? (
          <Landing
            setNewUseCaseModalOpen={setNewUseCaseModalOpen}
            setCurrentUseCase={setCurrentUseCase}
            setSidebarTabSelected={setSidebarTabSelected}
          />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
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
            <UseCaseOptions
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              testCaseName={name}
              isUseCaseSaved={isUseCaseSaved}
              useCaseName={name}
              changesDetected={changesDetected}
              type={type}
              onSave={onSave}
              setUseCaseName={setName}
              setNewUseCaseModalOpen={setNewUseCaseModalOpen}
              setDeleteUseCaseModalOpen={setDeleteUseCaseModalOpen}
              setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
              setEditNameModalOpen={setEditNameModalOpen}
              setCurrentUseCase={setCurrentUseCase}
            />
            <CriteriaView
              criteria={criteria}
              setCriteria={setCriteria}
              type={type}
              className={classes['left-padding']}
              style={{ marginBottom: '1rem' }}
            />

            <PipelineSelect
              type={type}
              selectedPipeline={selectedPipeline}
              setSelectedPipeline={setSelectedPipeline}
              style={{ marginBottom: '2rem' }}
            />

            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>

            <TextArea
              onChange={(e) => {
                setContext(e.target.value), autoUpdateSize(e.target)
              }}
              rows={1}
              ref={instructionRef}
              value={context}
              id="text-area-context"
              labelText="Task context (optional)"
              style={{ marginBottom: '1rem', resize: 'none' }}
              placeholder="Context information relevant to the evaluation such as prompt, data variables etc."
              className={classes['left-padding']}
            />

            <Responses
              responses={responses}
              setResponses={setResponses}
              style={{ marginBottom: '2rem' }}
              className={classes['left-padding']}
              type={type}
              results={results}
            />

            <EvaluateButton
              evaluationRunning={evaluationRunning}
              runEvaluation={runEvaluation}
              bamAPIKey={bamAPIKey}
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
              type={type}
              style={{ marginBottom: '1rem' }}
            />
          </>
        )}
      </div>
      <SwitchUseCaseModal
        setCurrentUseCase={setCurrentUseCase}
        open={confirmationModalOpen}
        setOpen={setConfirmationModalOpen}
        selectedUseCase={libraryUseCaseSelected}
      />
      <SaveAsUseCaseModal
        type={type}
        open={saveUseCaseModalOpen}
        setOpen={setSaveUseCaseModalOpen}
        onSaveAs={onSaveAs}
      />
      <NewUseCaseModal
        open={newUseCaseModalOpen}
        setOpen={setNewUseCaseModalOpen}
        changesDetected={changesDetected}
        setCurrentUseCase={setCurrentUseCase}
      />
      <DeleteUseCaseModal
        open={deleteUseCaseModalOpen}
        setOpen={setDeleteUseCaseModalOpen}
        onDeleteUseCase={onDeleteUseCase}
        useCaseName={name}
      />
      <EditUseCaseNameModal
        open={editNameModalOpen}
        setOpen={setEditNameModalOpen}
        name={name}
        setName={setName}
        userUseCases={userUseCases}
        setUserUseCases={setUserUseCases}
      />
    </>
  )
}
