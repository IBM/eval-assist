import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { useCriterias } from '@customHooks/useCriterias'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'
import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'
import { useParseFetchedUseCase } from '@customHooks/useParseFetchedUseCase'
import { useSaveShortcut } from '@customHooks/useSaveShortcut'
import { useUnitxtNotebook } from '@customHooks/useUnitxtNotebook'
import { StoredUseCase } from '@prisma/client'
import { getJSONStringWithSortedKeys, stringifyQueryParams, toSnakeCase } from '@utils/utils'

import {
  DirectAssessmentResult,
  DirectAssessmentResults,
  EvaluationType,
  Evaluator,
  FetchedDirectAssessmentResults,
  FetchedPairwiseComparisonResults,
  ModelProviderType,
  PairwiseComparisonResults,
  PerResponsePairwiseResult,
  UseCase,
} from '../../types'
import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { ContextVariables } from './ContextVariables'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { PromptModal } from './Modals/PromptModal'
import { ResultDetailsModal } from './Modals/ResultDetailsModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { PipelineSelect } from './PipelineSelect'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { useUserUseCasesContext } from './Providers/UserUseCasesProvider'
import { Responses } from './Responses'
import classes from './SingleExampleEvaluation.module.scss'
import { UseCaseOptions } from './UseCaseOptions'

export const SingleExampleEvaluation = () => {
  const { preloadedUseCase } = useURLInfoContext()
  const [currentUseCase, setCurrentUseCase] = useState(preloadedUseCase)
  const { userUseCases, setUserUseCases } = useUserUseCasesContext()
  // we are ignoring client side rendering to be able to use useSessionStorage
  const showingTestCase = useMemo<boolean>(() => preloadedUseCase !== null, [preloadedUseCase])
  const [useCaseSelected, setUseCaseSelected] = useState<{ useCase: UseCase; subCatalogName: string | null } | null>(
    null,
  )

  // if the usecase doesnt have an id, it means it hasn't been stored
  const isUseCaseSaved = useMemo(() => currentUseCase !== null && currentUseCase.id !== null, [currentUseCase])
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [resultDetailsModalOpen, setResultDetailsModalOpen] = useState(false)
  const [evaluationRunningModalOpen, setEvaluationRunningModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedResultDetails, setSelectedResultDetails] = useState<{
    result: DirectAssessmentResult | PerResponsePairwiseResult | null
    expectedResult: string
    responseIndex: string
  }>({ result: null, expectedResult: '', responseIndex: '' })

  const { setSidebarTabSelected } = useAppSidebarContext()

  const currentUseCaseString = useMemo<string>(
    () => (currentUseCase !== null && showingTestCase ? getJSONStringWithSortedKeys(currentUseCase) : ''),
    [showingTestCase, currentUseCase],
  )

  const [lastSavedUseCaseString, setLastSavedUseCaseString] = useState<string>(currentUseCaseString)

  const { isRisksAndHarms } = useURLInfoContext()

  const changesDetected = useMemo(
    () => showingTestCase && lastSavedUseCaseString !== currentUseCaseString && !isRisksAndHarms,
    [showingTestCase, lastSavedUseCaseString, currentUseCaseString, isRisksAndHarms],
  )

  const noUseCaseSelected = useMemo(() => currentUseCase === null, [currentUseCase])
  const contextVariables = useMemo(
    () => (noUseCaseSelected ? [] : (currentUseCase as UseCase).contextVariables),
    [currentUseCase, noUseCaseSelected],
  )
  const responseVariableName = useMemo(
    () => (noUseCaseSelected ? '' : (currentUseCase as UseCase).responseVariableName),
    [currentUseCase, noUseCaseSelected],
  )
  const toHighlightWords = useMemo(() => {
    return !noUseCaseSelected
      ? {
          contextVariables: contextVariables?.map((c) => c.variable),
          responseVariableName,
        }
      : {
          contextVariables: [],
          responseVariableName: '',
        }
  }, [contextVariables, noUseCaseSelected, responseVariableName])

  const { modelProviderCredentials, setModelProviderCredentials, getAreRelevantCredentialsProvided } =
    useModelProviderCredentials()

  const areRelevantCredentialsProvided = useMemo(
    () => getAreRelevantCredentialsProvided(currentUseCase?.evaluator?.provider || ModelProviderType.RITS),
    [currentUseCase?.evaluator?.provider, getAreRelevantCredentialsProvided],
  )

  const popoverRef = useRef<HTMLDivElement>()
  const [evaluationRunningToastId, setEvaluationRunningToastId] = useState<string | null>(null)
  const router = useRouter()

  const { getUserName } = useAuthentication()

  const { addToast, removeToast } = useToastContext()
  const { deleteCustom, post, put } = useFetchUtils()
  const { getQueryParamsFromUseCase } = useGetQueryParamsFromUseCase()
  useBeforeOnload(changesDetected)
  const { parseFetchedUseCase, CURRENT_FORMAT_VERSION } = useParseFetchedUseCase()
  const temporaryIdRef = useRef(uuid())
  const { getCriteria } = useCriterias()
  const { downloadUnitxtNotebook } = useUnitxtNotebook({
    criteria: currentUseCase?.criteria,
    evaluatorName: currentUseCase?.evaluator?.name,
    responses: currentUseCase?.responses,
    contextVariables: currentUseCase?.contextVariables,
    provider: currentUseCase?.evaluator?.provider,
    credentials: modelProviderCredentials[currentUseCase?.evaluator?.provider || ModelProviderType.RITS],
    evaluator_type: currentUseCase?.type,
  })
  const isEqualToCurrentTemporaryId = useCallback((id: string) => temporaryIdRef.current === id, [temporaryIdRef])

  const runEvaluation = useCallback(async () => {
    if (currentUseCase === null) return
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    const inProgressEvalToastId = addToast({
      title: 'Running evaluation...',
      kind: 'info',
    })
    setEvaluationRunningToastId(inProgressEvalToastId)
    // temporaryIdSnapshot is used to discern whether the current test case
    // was changed during the evaluation request
    const temporaryIdSnapshot = temporaryIdRef.current
    let response
    const parsedContextVariables = currentUseCase.contextVariables.reduce(
      (acc, item, index) => ({ ...acc, [item.variable]: item.value }),
      {},
    )

    const parsedCriteria = { ...currentUseCase.criteria }
    if (isRisksAndHarms) {
      // check if criteria description changed and criteria name didn't
      const harmsAndRiskCriteria = getCriteria(
        `${toSnakeCase(currentUseCase.criteria.name)}>${toSnakeCase(currentUseCase.responseVariableName)}`,
        EvaluationType.DIRECT,
      )
      if (harmsAndRiskCriteria !== null && harmsAndRiskCriteria.description !== currentUseCase.criteria.description) {
        // the tokenizer of granite guardian will complain if we send a predefined criteria name
        // with a custom description.
        parsedCriteria.name = `${parsedCriteria.name}_variation`
      }
    }
    let body: any = {
      context_variables: parsedContextVariables,
      responses: currentUseCase.responses,
      evaluator_name: currentUseCase.evaluator?.name,
      provider: currentUseCase.evaluator?.provider,
      criteria: parsedCriteria,
      type: currentUseCase.type,
      response_variable_name: currentUseCase.responseVariableName,
    }
    body['llm_provider_credentials'] = {
      ...modelProviderCredentials[currentUseCase.evaluator?.provider || ModelProviderType.RITS],
    }

    // changing api_key to apikey this way for backward compatibility
    // if (currentUseCase.evaluator?.provider === ModelProviderType.WATSONX) {
    //   body['llm_provider_credentials']['apikey'] = modelProviderCredentials[ModelProviderType.WATSONX].api_key
    //   delete body['llm_provider_credentials']['api_key']
    // }
    const startEvaluationTime = new Date().getTime() / 1000
    response = await post('evaluate/', body)
    const endEvaluationTime = new Date().getTime() / 1000
    const totalEvaluationTime = Math.round(endEvaluationTime - startEvaluationTime)
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
        removeToast(inProgressEvalToastId)

        addToast({
          kind: 'error',
          title: 'Evaluation failed',
          subtitle: errorMessage,
          timeout: 5000,
        })

        return
      }

      // response is ok
      const responseBody = await response.json()
      addToast({
        kind: 'success',
        title: 'Evaluation finished',
        subtitle: `Took ${totalEvaluationTime} seconds`,
        timeout: 5000,
      })

      let results: DirectAssessmentResults | PairwiseComparisonResults

      if (currentUseCase.type === EvaluationType.DIRECT) {
        results = (responseBody.results as FetchedDirectAssessmentResults).map(
          (result) =>
            ({
              name: currentUseCase.criteria.name,
              option: result.option,
              positionalBiasOption: result.positional_bias_option,
              summary: result.summary,
              positionalBias: result.positional_bias,
              certainty: result.certainty,
            } as DirectAssessmentResult),
        )
      } else {
        const perResponseResults: PairwiseComparisonResults = {}
        const fetchedResults = responseBody as FetchedPairwiseComparisonResults
        Object.entries(fetchedResults.results).forEach(([result_idx, fetchedPerResponseResult]) => {
          perResponseResults[result_idx] = {
            contestResults: fetchedPerResponseResult.contest_results,
            comparedTo: fetchedPerResponseResult.compared_to,
            summaries: fetchedPerResponseResult.summaries,
            positionalBias:
              fetchedPerResponseResult.positional_bias ||
              new Array(fetchedPerResponseResult.contest_results.length).fill(false),
            certainties: fetchedPerResponseResult.certainty,
            winrate: fetchedPerResponseResult.winrate,
            ranking: fetchedPerResponseResult.ranking,
          }
        })
        results = perResponseResults
      }

      setCurrentUseCase((previousCurrentUseCase) => {
        if (previousCurrentUseCase !== null) {
          return {
            ...previousCurrentUseCase,
            results,
          }
        } else {
          return null
        }
      })

      removeToast(inProgressEvalToastId)
    }
  }, [
    addToast,
    currentUseCase,
    getCriteria,
    isEqualToCurrentTemporaryId,
    isRisksAndHarms,
    modelProviderCredentials,
    post,
    removeToast,
  ])

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
    (useCaseSelected: { useCase: UseCase; subCatalogName: string | null } | null) => {
      let urlChangePromise: Promise<boolean>
      if (useCaseSelected !== null) {
        // use case is a saved user test case
        urlChangePromise = changeUseCaseURL(
          getQueryParamsFromUseCase(useCaseSelected.useCase, useCaseSelected.subCatalogName),
        )
        if (evaluationRunningToastId) removeToast(evaluationRunningToastId)
        setEvaluationRunningToastId(null)
        // if evaluation is running, cancel it (superficially)
        if (evaluationRunning) {
          setEvaluationRunning(false)
        }
      }
    },
    [changeUseCaseURL, evaluationRunning, evaluationRunningToastId, getQueryParamsFromUseCase, removeToast],
  )

  const onSave = useCallback(async () => {
    if (currentUseCase === null) return
    const savedUseCase: StoredUseCase = await (
      await put('use_case/', {
        use_case: {
          name: currentUseCase.name,
          content: JSON.stringify({
            contextVariables: currentUseCase.contextVariables,
            responses: currentUseCase.responses,
            criteria: currentUseCase.criteria,
            results: currentUseCase.results,
            type: currentUseCase.type,
            evaluator: currentUseCase.evaluator,
            expectedResults: currentUseCase.expectedResults,
            responseVariableName: currentUseCase.responseVariableName,
            contentFormatVersion: CURRENT_FORMAT_VERSION,
          }),
          user_id: -1,
          id: currentUseCase.id,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase)

    setCurrentUseCase(parsedSavedUseCase)
    // update use case in the use cases list
    const i = userUseCases.findIndex((useCase) => useCase.id === currentUseCase.id)
    setUserUseCases([...userUseCases.slice(0, i), parsedSavedUseCase, ...userUseCases.slice(i + 1)])

    // update lastSavedUseCase
    setLastSavedUseCaseString(currentUseCaseString)

    // notify the user
    addToast({
      kind: 'success',
      title: `Test case saved`,
      timeout: 5000,
    })
  }, [
    CURRENT_FORMAT_VERSION,
    addToast,
    currentUseCase,
    currentUseCaseString,
    getUserName,
    parseFetchedUseCase,
    put,
    setUserUseCases,
    userUseCases,
  ])

  const onSaveAs = useCallback(
    async (name: string, fromUseCase?: UseCase) => {
      if (currentUseCase === null) return false
      const toSaveUseCase = fromUseCase ?? currentUseCase
      const res = await put('use_case/', {
        use_case: {
          name: name,
          content: JSON.stringify({
            contextVariables: toSaveUseCase.contextVariables,
            responses: toSaveUseCase.responses,
            criteria: toSaveUseCase.criteria,
            results: toSaveUseCase.results,
            type: toSaveUseCase.type,
            pipeline: toSaveUseCase.evaluator,
            expectedResults: toSaveUseCase.expectedResults,
            responseVariableName: toSaveUseCase.responseVariableName,
            contentFormatVersion: CURRENT_FORMAT_VERSION,
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
        // useCaseSelected will be different from null when
        // save as is done before switching from an unsaved
        // test case that has changes detected
        // if useCaseSelected is different from null
        // a rediction will be done to that selected test casen
        if (useCaseSelected === null) {
          updateURLFromUseCase({ useCase: parsedSavedUseCase, subCatalogName: null })
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
    },
    [
      CURRENT_FORMAT_VERSION,
      addToast,
      currentUseCase,
      getUserName,
      parseFetchedUseCase,
      put,
      setSidebarTabSelected,
      setUserUseCases,
      updateURLFromUseCase,
      useCaseSelected,
      userUseCases,
    ],
  )

  useSaveShortcut({ onSave, isUseCaseSaved, changesDetected, setSaveUseCaseModalOpen })

  const onSetSelectedPipeline = async (evaluator: Evaluator | null) => {
    if (currentUseCase === null) return
    setCurrentUseCase({
      ...currentUseCase,
      evaluator,
    })
  }

  const onDeleteUseCase = async () => {
    if (currentUseCase === null) return
    await deleteCustom('use_case/', { use_case_id: currentUseCase.id })

    // notify the user
    addToast({
      kind: 'success',
      title: `Deleted use case '${currentUseCase.name}'`,
      timeout: 5000,
    })

    setUserUseCases(userUseCases.filter((u) => u.id !== currentUseCase.id))
    changeUseCaseURL(null)
  }

  // update the state if the preloaded test case changes
  useEffect(() => {
    if (preloadedUseCase !== null) {
      setUseCaseSelected(null)
      setCurrentUseCase({ ...preloadedUseCase })
      setLastSavedUseCaseString(getJSONStringWithSortedKeys(preloadedUseCase))
      temporaryIdRef.current = uuid()
    } else {
      setCurrentUseCase(null)
    }
  }, [preloadedUseCase])

  return (
    <>
      <AppSidenavNew
        setConfirmationModalOpen={setConfirmationModalOpen}
        setLibraryUseCaseSelected={setUseCaseSelected}
        userUseCases={userUseCases}
        changesDetected={changesDetected}
        updateURLFromUseCase={updateURLFromUseCase}
        evaluationRunning={evaluationRunning}
        setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
      />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        {currentUseCase === null ? (
          <Landing setNewUseCaseModalOpen={setNewUseCaseModalOpen} updateURLFromUseCase={updateURLFromUseCase} />
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
              className={cx(classes['bottom-divider'], classes['left-padding'])}
            >
              <h3>Evaluation sandbox</h3>

              <APIKeyPopover
                popoverOpen={popoverOpen}
                setPopoverOpen={setPopoverOpen}
                modelProviderCrentials={modelProviderCredentials}
                setModelProviderCredentials={setModelProviderCredentials}
                areRelevantCredentialsProvided={areRelevantCredentialsProvided}
              />
            </div>
            <UseCaseOptions
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              isUseCaseSaved={isUseCaseSaved}
              useCaseName={currentUseCase.name}
              changesDetected={changesDetected}
              type={currentUseCase.type}
              onSave={onSave}
              setUseCaseName={(name) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, name } : null,
                )
              }
              setNewUseCaseModalOpen={setNewUseCaseModalOpen}
              setDeleteUseCaseModalOpen={setDeleteUseCaseModalOpen}
              setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
              setEditNameModalOpen={setEditNameModalOpen}
              downloadUnitxtNotebook={downloadUnitxtNotebook}
            />
            <ContextVariables
              contextVariables={currentUseCase.contextVariables}
              setContextVariables={(contextVariables) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, contextVariables } : null,
                )
              }
              style={{ marginBottom: '1rem' }}
            />
            <CriteriaView
              criteria={currentUseCase.criteria}
              setCriteria={(criteria) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, criteria } : null,
                )
              }
              toHighlightWords={toHighlightWords}
              type={currentUseCase.type}
              temporaryId={temporaryIdRef.current}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
            />
            <PipelineSelect
              type={currentUseCase.type}
              selectedPipeline={currentUseCase.evaluator}
              setSelectedPipeline={onSetSelectedPipeline}
              style={{ marginBottom: '2rem' }}
              className={classes['left-padding']}
            />
            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>
            <Responses
              responses={currentUseCase.responses}
              setResponses={(responses) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, responses } : null,
                )
              }
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              type={currentUseCase.type}
              results={currentUseCase.results}
              setExpectedResults={(expectedResults) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, expectedResults } : null,
                )
              }
              setResults={(results) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, results } : null,
                )
              }
              evaluationRunning={evaluationRunning}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              criteria={currentUseCase.criteria}
              expectedResults={currentUseCase.expectedResults}
              responseVariableName={currentUseCase.responseVariableName}
              setResponseVariableName={(responseVariableName) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, responseVariableName } : null,
                )
              }
            />
            <EvaluateButton
              evaluationRunning={evaluationRunning}
              runEvaluation={runEvaluation}
              areRelevantCredentialsProvided={areRelevantCredentialsProvided}
              className={classes['left-padding']}
              setPromptModalOpen={setPromptModalOpen}
            />

            {!areRelevantCredentialsProvided && !evaluationRunning && !evaluationFailed && (
              <p className={`${classes['left-padding']} ${classes['api-key-reminder-text']}`}>
                {`You need to provide the ${currentUseCase.evaluator?.provider.toUpperCase()} credentials to run evaluations.`}
              </p>
            )}
          </>
        )}
      </div>
      <NewUseCaseModal
        open={newUseCaseModalOpen}
        setOpen={setNewUseCaseModalOpen}
        changesDetected={changesDetected}
        updateURLFromUseCase={updateURLFromUseCase}
      />
      {currentUseCase !== null && (
        <>
          <SwitchUseCaseModal
            updateURLFromUseCase={updateURLFromUseCase}
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
            type={currentUseCase.type}
            open={saveUseCaseModalOpen}
            setOpen={setSaveUseCaseModalOpen}
            onSaveAs={onSaveAs}
          />

          <DeleteUseCaseModal
            open={deleteUseCaseModalOpen}
            setOpen={setDeleteUseCaseModalOpen}
            onDeleteUseCase={onDeleteUseCase}
            useCaseName={currentUseCase.name}
          />
          <EditUseCaseNameModal
            open={editNameModalOpen}
            setOpen={setEditNameModalOpen}
            name={currentUseCase.name}
            setName={(name) =>
              setCurrentUseCase((previousCurrentUseCase) =>
                previousCurrentUseCase !== null ? { ...previousCurrentUseCase, name } : null,
              )
            }
            userUseCases={userUseCases}
            setUserUseCases={setUserUseCases}
          />
          <EvaluationRunningModal
            open={evaluationRunningModalOpen}
            setOpen={setEvaluationRunningModalOpen}
            updateURLFromUseCase={updateURLFromUseCase}
            selectedUseCase={useCaseSelected}
            setConfirmationModalOpen={setConfirmationModalOpen}
            changesDetected={changesDetected}
          />
          <ResultDetailsModal
            open={resultDetailsModalOpen}
            setOpen={setResultDetailsModalOpen}
            selectedResultDetails={selectedResultDetails}
            setSelectedResultDetails={setSelectedResultDetails}
            type={currentUseCase.type}
          />
          <PromptModal
            open={promptModalOpen}
            setOpen={setPromptModalOpen}
            currentUseCase={currentUseCase}
            modelProviderCredentials={modelProviderCredentials}
          />
        </>
      )}
    </>
  )
}
