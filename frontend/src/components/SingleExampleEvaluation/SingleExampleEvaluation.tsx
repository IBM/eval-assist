import cx from 'classnames'
import { useLocalStorage } from 'usehooks-ts'
import { v4 as uuid } from 'uuid'

import { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { StoredUseCase } from '@prisma/client'
import {
  getEmptyCriteria,
  getQueryParamsFromUseCase,
  getUseCaseStringWithSortedKeys,
  parseFetchedUseCase,
  returnByPipelineType,
  stringifyQueryParams,
} from '@utils/utils'

import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { TestCaseContext } from './Context/TestCaseContext'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { ResultDetailsModal } from './Modals/ResultDetailsModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { PipelineSelect } from './PipelineSelect'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { useUserUseCasesContext } from './Providers/UserUseCasesProvider'
import { Responses } from './Responses'
import classes from './SingleExampleEvaluation.module.scss'
import { UseCaseOptions } from './UseCaseOptions'
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

export const SingleExampleEvaluation = () => {
  const { preloadedUseCase } = useURLInfoContext()
  const { userUseCases, setUserUseCases } = useUserUseCasesContext()
  // we are ignoring client side rendering to be able to use useSessionStorage
  const [showingTestCase, setShowingTestCase] = useState<boolean>(preloadedUseCase !== null)
  const [useCaseSelected, setUseCaseSelected] = useState<UseCase | null>(preloadedUseCase)
  // if the usecase doesnt have an id, it means it hasn't been stored
  const [id, setId] = useState<number | null>(preloadedUseCase ? preloadedUseCase.id : null)
  const [name, setName] = useState(preloadedUseCase ? preloadedUseCase.name : '')
  const [type, setType] = useState<PipelineType>(preloadedUseCase ? preloadedUseCase.type : PipelineType.RUBRIC)
  const [context, setContext] = useState(preloadedUseCase ? preloadedUseCase.context : '')
  const [responses, setResponses] = useState(
    preloadedUseCase ? preloadedUseCase.responses : type === PipelineType.RUBRIC ? [''] : ['', ''],
  )
  const [criteria, setCriteria] = useState<RubricCriteria | PairwiseCriteria>(
    preloadedUseCase ? preloadedUseCase.criteria : getEmptyCriteria(type),
  )
  const [results, setResults] = useState<(RubricResult | PairwiseResult)[] | null>(
    preloadedUseCase ? preloadedUseCase.results : null,
  )
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(
    preloadedUseCase ? preloadedUseCase.pipeline : null,
  )

  const isUseCaseSaved = useMemo(() => id !== null, [id])
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [resultDetailsModalOpen, setResultDetailsModalOpen] = useState(false)
  const [evaluationRunningModalOpen, setEvaluationRunningModalOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const [selectedResultDetails, setSelectedResultDetails] = useState<RubricResult | PairwiseResult | null>(null)

  const { setSidebarTabSelected } = useAppSidebarContext()

  const currentUseCase = useMemo(
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

  const currentUseCaseString = useMemo<string>(
    () => (showingTestCase ? getUseCaseStringWithSortedKeys(currentUseCase) : ''),
    [showingTestCase, currentUseCase],
  )

  const [lastSavedUseCaseString, setLastSavedUseCaseString] = useState<string>(currentUseCaseString)

  const changesDetected = useMemo(
    () => showingTestCase && lastSavedUseCaseString !== currentUseCaseString,
    [showingTestCase, lastSavedUseCaseString, currentUseCaseString],
  )

  const [bamAPIKey, setBamAPIKey, removeBamAPIKey] = useLocalStorage<string>('bamAPIKey', '')

  const popoverRef = useRef<HTMLDivElement>()
  const [evaluationRunningToastId, setEvaluationRunningToastId] = useState<string | null>(null)
  const router = useRouter()

  const { getUserName } = useAuthentication()

  const { addToast, removeToast } = useToastContext()
  const { deleteCustom, post, put } = useFetchUtils()
  useBeforeOnload(changesDetected)

  const temporaryIdRef = useRef(uuid())

  const isEqualToCurrentTemporaryId = useCallback((id: string) => temporaryIdRef.current === id, [temporaryIdRef])

  const { rubricPipelines, pairwisePipelines, loadingPipelines } = usePipelineTypesContext()

  useEffect(() => {
    if (selectedPipeline === null && rubricPipelines !== null && pairwisePipelines !== null && !loadingPipelines) {
      const defaultPipeline = returnByPipelineType(type, rubricPipelines[0], pairwisePipelines[0]) as string
      setSelectedPipeline(returnByPipelineType(type, rubricPipelines[0], pairwisePipelines[0]))
      setLastSavedUseCaseString(getUseCaseStringWithSortedKeys({ ...currentUseCase, pipeline: defaultPipeline }))
    }
  }, [
    selectedPipeline,
    rubricPipelines,
    pairwisePipelines,
    setSelectedPipeline,
    loadingPipelines,
    type,
    currentUseCase,
  ])

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    const toastId = addToast({
      title: 'Running evaluation...',
      kind: 'info',
    })
    setEvaluationRunningToastId(toastId)
    // temporaryIdSnapshot is used to discern whether the current test case
    // was changed during the evaluation request
    const temporaryIdSnapshot = temporaryIdRef.current
    let response
    if (type === PipelineType.RUBRIC) {
      response = await post('evaluate/rubric/', {
        context,
        responses,
        rubric: { name: criteria.name, criteria: criteria.criteria, options: (criteria as RubricCriteria).options },
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

    // only perform after-evaluation-finished actions if the current test case didn't change
    if (isEqualToCurrentTemporaryId(temporaryIdSnapshot)) {
      setEvaluationRunning(false)

      if (!response.ok) {
        const error = (await response.json()) as {
          detail: string
        }

        const errorMessage =
          typeof error.detail === 'string'
            ? error.detail
            : `Something went wrong with the evaluation (${
                (error.detail as { type: string; msg: string }[])[0].type
              }: ${(error.detail as { type: string; msg: string }[])[0].msg})`

        setEvaluationFailed(true)
        // We are catching this error an so we show the message sent from the backend

        addToast({
          kind: 'error',
          title: 'Evaluation failed',
          subtitle: errorMessage,
        })

        return
      }

      // response is ok

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
      removeToast(toastId)
    }
  }

  const changeUseCaseURL = useCallback(
    (queryParams: { key: string; value: string }[] | null) => {
      if (queryParams !== null) {
        const paramsString = stringifyQueryParams(queryParams)
        return router.push(`/${paramsString}`, `/${paramsString}`, {
          shallow: true,
        })
      } else {
        return router.push({ pathname: '/' }, `/`, { shallow: true })
      }
    },
    [router],
  )

  const updateURLFromUseCase = useCallback(
    (useCase: UseCase) => {
      let urlChangePromise: Promise<boolean>
      // use case is a saved user test case
      urlChangePromise = changeUseCaseURL(getQueryParamsFromUseCase(useCase))
      if (evaluationRunningToastId) removeToast(evaluationRunningToastId)
      setEvaluationRunningToastId(null)
      // if evaluation is running, cancel it (superficially)
      if (evaluationRunning) {
        setEvaluationRunning(false)
      }
    },
    [changeUseCaseURL, evaluationRunning, evaluationRunningToastId, removeToast],
  )

  const updateLastSavedPipeline = useCallback(() => {
    setLastSavedUseCaseString(currentUseCaseString)
  }, [setLastSavedUseCaseString, currentUseCaseString])

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
    const toSaveUseCase = fromUseCase ?? currentUseCase
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

      // useCaseSelected will different from null when
      // save as is done before switching from an unsaved
      // test case that has changes detected
      // if useCaseSelected is different from null
      // a rediction will be done to that selected test casen
      if (useCaseSelected === null) {
        updateURLFromUseCase(parsedSavedUseCase)
        setSidebarTabSelected('user_use_cases')
      } else {
        updateURLFromUseCase(useCaseSelected)
      }
      setUserUseCases([...userUseCases, parsedSavedUseCase])

      // notify the user
      addToast({
        kind: 'success',
        title: `Created use case '${parsedSavedUseCase.name}'`,
        timeout: 5000,
      })
    }
    return true
  }

  const onSetSelectedPipeline = async (pipeline: string) => {
    setSelectedPipeline(pipeline)
    // if (pipeline != selectedPipeline && results && results.length > 0)
    //   setResults([])
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

  // update the state if the preloaded test case changes
  useEffect(() => {
    if (preloadedUseCase !== null) {
      setUseCaseSelected(preloadedUseCase)
      setId(preloadedUseCase.id)
      setName(preloadedUseCase.name)
      setType(preloadedUseCase.type)
      setContext(preloadedUseCase.context)
      setResponses(preloadedUseCase.responses)
      setCriteria(preloadedUseCase.criteria)
      setResults(preloadedUseCase.results)
      setSelectedPipeline(preloadedUseCase.pipeline)
      setLastSavedUseCaseString(getUseCaseStringWithSortedKeys(preloadedUseCase))
      setShowingTestCase(true)
      setUseCaseSelected(null)
      temporaryIdRef.current = uuid()
    } else if (preloadedUseCase === null) {
      setShowingTestCase(false)
    }
  }, [preloadedUseCase])

  return (
    <>
      <AppSidenavNew
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setUseCaseSelected}
        userUseCases={userUseCases}
        changesDetected={changesDetected}
        setCurrentUseCase={updateURLFromUseCase}
        evaluationRunning={evaluationRunning}
        setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
      />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        {!showingTestCase ? (
          <Landing setNewUseCaseModalOpen={setNewUseCaseModalOpen} setCurrentUseCase={updateURLFromUseCase} />
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
              setCurrentUseCase={updateURLFromUseCase}
            />
            <CriteriaView
              criteria={criteria}
              setCriteria={setCriteria}
              type={type}
              temporaryId={temporaryIdRef.current}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
            />
            <PipelineSelect
              type={type}
              selectedPipeline={selectedPipeline}
              setSelectedPipeline={onSetSelectedPipeline}
              style={{ marginBottom: '2rem' }}
            />
            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>
            <TestCaseContext context={context} setContext={setContext} />
            <Responses
              responses={responses}
              setResponses={setResponses}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              type={type}
              results={results}
              setResults={setResults}
              evaluationRunning={evaluationRunning}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
            />

            <EvaluateButton
              evaluationRunning={evaluationRunning}
              runEvaluation={runEvaluation}
              bamAPIKey={bamAPIKey}
              className={classes['left-padding']}
            />

            {bamAPIKey === '' && !evaluationRunning && results === null && !evaluationFailed && (
              <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
                {'You will need to provide your BAM API key to run the evaluation'}
              </p>
            )}
          </>
        )}
      </div>
      <SwitchUseCaseModal
        setCurrentUseCase={updateURLFromUseCase}
        open={confirmationModalOpen}
        setOpen={setConfirmationModalOpen}
        selectedUseCase={useCaseSelected}
        currentUseCase={currentUseCase}
        onSave={onSave}
        setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
        evaluationRunning={evaluationRunning}
        setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
        setLibraryUseCaseSelected={setUseCaseSelected}
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
        setCurrentUseCase={updateURLFromUseCase}
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
      <EvaluationRunningModal
        open={evaluationRunningModalOpen}
        setOpen={setEvaluationRunningModalOpen}
        setCurrentUseCase={updateURLFromUseCase}
        selectedUseCase={useCaseSelected}
        setConfirmationModalOpen={setConfirmationModalOpen}
        changesDetected={changesDetected}
      />
      <ResultDetailsModal
        open={resultDetailsModalOpen}
        setOpen={setResultDetailsModalOpen}
        selectedResultDetails={selectedResultDetails}
        setSelectedResultDetails={setSelectedResultDetails}
      />
    </>
  )
}
