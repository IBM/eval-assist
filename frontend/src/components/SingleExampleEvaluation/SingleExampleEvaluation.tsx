import cx from 'classnames'
import { getJSONStringWithSortedKeys, returnByPipelineType, stringifyQueryParams, toSnakeCase } from 'src/utils'
import { v4 as uuid } from 'uuid'

import { LegacyRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useGenerateSystheticExamples } from '@customHooks/useGenerateSystheticExamples'
import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'
import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'
import { useParseFetchedUseCase } from '@customHooks/useParseFetchedUseCase'
import { useSaveShortcut } from '@customHooks/useSaveShortcut'
import { useUnitxtCodeGeneration } from '@customHooks/useUnitxtNotebookGeneration'
import { StoredUseCase } from '@prisma/client'

import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Evaluator,
  FetchedDirectInstanceResult,
  FetchedDirectResults,
  FetchedPairwiseInstanceResult,
  FetchedPairwiseResults,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  PairwiseInstanceResult,
  UseCase,
} from '../../types'
import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { ChooseCodeGenerationType } from './Modals/ChooseCodeGenerationType'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { InstanceDetailsModal } from './Modals/InstanceDetailsModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { PromptModal } from './Modals/PromptModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { SyntheticGenerationModal } from './Modals/SyntheticGenerationModal'
import { PipelineSelect } from './PipelineSelect'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'
import { useCriteriasContext } from './Providers/CriteriasProvider'
import { usePipelineTypesContext } from './Providers/PipelineTypesProvider'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { useUserUseCasesContext } from './Providers/UserUseCasesProvider'
import classes from './SingleExampleEvaluation.module.scss'
import { TestDataTable } from './TestDataTable'
import { UseCaseOptions } from './UseCaseOptions'

export const SingleExampleEvaluation = () => {
  const { preloadedUseCase } = useURLInfoContext()
  const [currentTestCase, setCurrentTestCase] = useState(preloadedUseCase)
  const { userUseCases, setUserUseCases } = useUserUseCasesContext()
  // we are ignoring client side rendering to be able to use useSessionStorage
  const showingTestCase = useMemo<boolean>(() => preloadedUseCase !== null, [preloadedUseCase])
  const [useCaseSelected, setUseCaseSelected] = useState<{ useCase: UseCase; subCatalogName: string | null } | null>(
    null,
  )
  const { isRisksAndHarms } = useURLInfoContext()

  // if the usecase doesnt have an id, it means it hasn't been stored
  const isUseCaseSaved = useMemo(() => currentTestCase !== null && currentTestCase.id !== null, [currentTestCase])
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
  const [sysntheticGenerationModalOpen, setSysntheticGenerationModalOpen] = useState(false)
  const [sampleCodeTypeModalOpen, setSampleCodeTypeModalOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)
  const [modelForSyntheticGeneration, setModelForSyntheticGeneration] = useState<Evaluator | null>(null)

  const { setSidebarTabSelected } = useAppSidebarContext()
  const currentUseCaseString = useMemo<string>(
    () => (currentTestCase !== null && showingTestCase ? getJSONStringWithSortedKeys(currentTestCase) : ''),
    [showingTestCase, currentTestCase],
  )

  const [lastSavedUseCaseString, setLastSavedUseCaseString] = useState<string>(currentUseCaseString)

  const changesDetected = useMemo(
    () => showingTestCase && lastSavedUseCaseString !== currentUseCaseString && !isRisksAndHarms,
    [showingTestCase, lastSavedUseCaseString, currentUseCaseString, isRisksAndHarms],
  )

  const noUseCaseSelected = useMemo(() => currentTestCase === null, [currentTestCase])

  const responseVariableName = useMemo(
    () => (noUseCaseSelected ? '' : (currentTestCase as UseCase).responseVariableName),
    [currentTestCase, noUseCaseSelected],
  )
  const toHighlightWords = useMemo(() => {
    return !noUseCaseSelected
      ? {
          contextVariables: currentTestCase?.instances[0]?.contextVariables.map((c) => c.name) || [],
          responseVariableName,
        }
      : {
          contextVariables: [],
          responseVariableName: '',
        }
  }, [currentTestCase?.instances, noUseCaseSelected, responseVariableName])

  const { modelProviderCredentials, setModelProviderCredentials, getAreRelevantCredentialsProvided } =
    useModelProviderCredentials()

  const { nonGraniteGuardianEvaluators, graniteGuardianEvaluators } = usePipelineTypesContext()

  const areRelevantCredentialsProvided = useMemo(
    () => getAreRelevantCredentialsProvided(currentTestCase?.evaluator?.provider || ModelProviderType.RITS),
    [currentTestCase?.evaluator?.provider, getAreRelevantCredentialsProvided],
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
  const { getCriteria } = useCriteriasContext()

  const contextVariableNames = useMemo(
    () => currentTestCase?.instances[0]?.contextVariables.map((c) => c.name) || [],
    [currentTestCase?.instances],
  )

  const setInstances = (instances: Instance[]) =>
    setCurrentTestCase((previousCurrentUseCase) => {
      if (previousCurrentUseCase !== null) {
        return {
          ...previousCurrentUseCase,
          instances,
        }
      } else {
        return null
      }
    })

  // TODO: refactor so that this component receives a test case that cant be null
  const { loadingSyntheticExamples, generateTestData } = useGenerateSystheticExamples({
    evaluatorType: currentTestCase?.type,
    criteria: currentTestCase?.criteria,
    responseVariableName: currentTestCase?.responseVariableName,
    contextVariableNames: contextVariableNames,
    instances: currentTestCase?.instances!,
    setInstances: setInstances,
    type: currentTestCase?.type!,
  })

  const responses = useMemo(
    () =>
      noUseCaseSelected
        ? []
        : returnByPipelineType(
            currentTestCase?.type || EvaluationType.DIRECT, // right-side will never happen
            (currentTestCase?.instances as DirectInstance[]).map((instance) => instance.response),
            (currentTestCase?.instances as PairwiseInstance[]).map((instance) => instance.responses),
          ),
    [currentTestCase?.instances, currentTestCase?.type, noUseCaseSelected],
  )

  const { downloadUnitxtCode } = useUnitxtCodeGeneration({
    testCaseName: currentTestCase?.name!,
    criteria: currentTestCase?.criteria!,
    evaluatorName: currentTestCase?.evaluator?.name || null,
    responses,
    contextVariablesList: currentTestCase?.instances.map((instance) => instance.contextVariables)!,
    provider: currentTestCase?.evaluator?.provider,
    credential_keys: Object.keys(
      modelProviderCredentials[currentTestCase?.evaluator?.provider || ModelProviderType.RITS],
    ),
    evaluatorType: currentTestCase?.type!,
  })

  const isEqualToCurrentTemporaryId = useCallback((id: string) => temporaryIdRef.current === id, [temporaryIdRef])

  const runEvaluation = useCallback(async () => {
    if (currentTestCase === null) return
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
    const parsedCriteria = { ...currentTestCase.criteria }
    if (isRisksAndHarms) {
      // check if criteria description changed and criteria name didn't
      const harmsAndRiskCriteria = getCriteria(toSnakeCase(currentTestCase.criteria.name), EvaluationType.DIRECT)
      if (harmsAndRiskCriteria !== null && harmsAndRiskCriteria.description !== currentTestCase.criteria.description) {
        // the tokenizer of granite guardian will complain if we send a predefined criteria name
        // with a custom description.
        removeToast(inProgressEvalToastId)
        addToast({
          kind: 'error',
          title: 'That risk already exist',
          subtitle: "Can't change the definition of an existing risk",
          timeout: 5000,
        })
        setEvaluationRunning(false)
        return
      }
    }
    let body: any = {
      instances: currentTestCase.instances.map((instance) => ({
        context_variables: instance.contextVariables.reduce(
          (acc, item, index) => ({ ...acc, [item.name]: item.value }),
          {},
        ),
        prediction: returnByPipelineType(
          currentTestCase.type,
          (instance as DirectInstance).response,
          (instance as PairwiseInstance).responses,
        ),
        prediction_variable_name: currentTestCase.responseVariableName,
      })),
      evaluator_name: currentTestCase.evaluator?.name,
      provider: currentTestCase.evaluator?.provider,
      criteria: parsedCriteria,
      type: currentTestCase.type,
      response_variable_name: currentTestCase.responseVariableName,
    }
    body['llm_provider_credentials'] = {
      ...modelProviderCredentials[currentTestCase.evaluator?.provider || ModelProviderType.RITS],
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
      let instancesWithResults: Instance[]
      if (currentTestCase.type === EvaluationType.DIRECT) {
        instancesWithResults = currentTestCase.instances.map((instance) => ({ ...instance } as DirectInstance))
        ;(responseBody.results as FetchedDirectResults).forEach(
          (fetchedInstanceResult: FetchedDirectInstanceResult, i) => {
            const instanceResult: DirectInstanceResult = {
              option: fetchedInstanceResult.option,
              positionalBiasOption: fetchedInstanceResult.positional_bias_option,
              explanation: fetchedInstanceResult.explanation,
              positionalBias: fetchedInstanceResult.positional_bias,
              certainty: fetchedInstanceResult.certainty,
            }
            instancesWithResults[i] = { ...instancesWithResults[i], result: instanceResult }
          },
        )
      } else {
        instancesWithResults = currentTestCase.instances.map((instance) => ({ ...instance } as PairwiseInstance))
        ;(responseBody.results as FetchedPairwiseResults).forEach(
          (fetchedInstanceResult: FetchedPairwiseInstanceResult, i) => {
            let instanceResult: PairwiseInstanceResult = {}
            Object.entries(fetchedInstanceResult).forEach(([result_idx, fetchedPerResponseResult]) => {
              instanceResult[result_idx] = {
                contestResults: fetchedPerResponseResult.contest_results,
                comparedTo: fetchedPerResponseResult.compared_to,
                summaries: fetchedPerResponseResult.summaries,
                positionalBias:
                  fetchedPerResponseResult.positional_bias ||
                  new Array(fetchedPerResponseResult.contest_results.length).fill(false),
                winrate: fetchedPerResponseResult.winrate,
                ranking: fetchedPerResponseResult.ranking,
              }
            })
            instancesWithResults[i] = { ...instancesWithResults[i], result: instanceResult }
          },
        )
      }
      setCurrentTestCase((previousCurrentUseCase) => {
        if (previousCurrentUseCase !== null) {
          return {
            ...previousCurrentUseCase,
            instances: instancesWithResults,
          }
        } else {
          return null
        }
      })

      removeToast(inProgressEvalToastId)
    }
  }, [
    addToast,
    currentTestCase,
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
    if (currentTestCase === null) return
    const savedUseCase: StoredUseCase = await (
      await put('test_case/', {
        test_case: {
          name: currentTestCase.name,
          content: JSON.stringify({
            instances: currentTestCase.instances,
            criteria: currentTestCase.criteria,
            type: currentTestCase.type,
            evaluator: currentTestCase.evaluator,
            responseVariableName: currentTestCase.responseVariableName,
            contentFormatVersion: CURRENT_FORMAT_VERSION,
          }),
          user_id: -1,
          id: currentTestCase.id,
        } as StoredUseCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedUseCase = parseFetchedUseCase(savedUseCase) as UseCase

    setCurrentTestCase(parsedSavedUseCase)
    // update use case in the use cases list
    const i = userUseCases.findIndex((useCase) => useCase.id === currentTestCase.id)
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
    currentTestCase,
    currentUseCaseString,
    getUserName,
    parseFetchedUseCase,
    put,
    setUserUseCases,
    userUseCases,
  ])

  const onSaveAs = useCallback(
    async (name: string, fromUseCase?: UseCase) => {
      if (currentTestCase === null) return false
      const toSaveUseCase = fromUseCase ?? currentTestCase
      const res = await put('test_case/', {
        test_case: {
          name: name,
          content: JSON.stringify({
            instances: currentTestCase.instances,
            criteria: toSaveUseCase.criteria,
            type: toSaveUseCase.type,
            pipeline: toSaveUseCase.evaluator,
            responseVariableName: currentTestCase.responseVariableName,
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
        const parsedSavedUseCase = parseFetchedUseCase(savedUseCase) as UseCase
        // useCaseSelected will be different from null when
        // save as is done before switching from an unsaved
        // test case that has changes detected
        // if useCaseSelected is different from null
        // a rediction will be done to that selected test casen
        if (useCaseSelected === null) {
          updateURLFromUseCase({ useCase: parsedSavedUseCase, subCatalogName: null })
          setSidebarTabSelected('user_test_cases')
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
      currentTestCase,
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

  const onSetSelectedPipeline = (evaluator: Evaluator | null) => {
    if (currentTestCase === null) return
    setCurrentTestCase({
      ...currentTestCase,
      evaluator,
    })
  }

  const onDeleteUseCase = async () => {
    if (currentTestCase === null) return
    await deleteCustom('test_case/', { test_case_id: currentTestCase.id })

    // notify the user
    addToast({
      kind: 'success',
      title: `Deleted use case '${currentTestCase.name}'`,
      timeout: 5000,
    })

    setUserUseCases(userUseCases.filter((u) => u.id !== currentTestCase.id))
    changeUseCaseURL(null)
  }

  // update the state if the preloaded test case changes
  useEffect(() => {
    if (preloadedUseCase !== null) {
      setUseCaseSelected(null)
      setCurrentTestCase({ ...preloadedUseCase })
      setLastSavedUseCaseString(getJSONStringWithSortedKeys(preloadedUseCase))
      temporaryIdRef.current = uuid()
    } else {
      setCurrentTestCase(null)
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
        {currentTestCase === null ? (
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
              useCaseName={currentTestCase.name}
              changesDetected={changesDetected}
              type={currentTestCase.type}
              onSave={onSave}
              setUseCaseName={(name) =>
                setCurrentTestCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, name } : null,
                )
              }
              setNewUseCaseModalOpen={setNewUseCaseModalOpen}
              setDeleteUseCaseModalOpen={setDeleteUseCaseModalOpen}
              setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
              setEditNameModalOpen={setEditNameModalOpen}
              downloadUnitxtNotebook={() => downloadUnitxtCode({ downloadAsScript: false })}
              setSampleCodeTypeModalOpen={setSampleCodeTypeModalOpen}
            />
            {/* <ContextVariables
              contextVariables={currentUseCase.contextVariables}
              setContextVariables={(contextVariables) =>
                setCurrentUseCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, contextVariables } : null,
                )
              }
              style={{ marginBottom: '1rem' }}
            /> */}
            <CriteriaView
              criteria={currentTestCase.criteria}
              setCriteria={(criteria) =>
                setCurrentTestCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, criteria } : null,
                )
              }
              toHighlightWords={toHighlightWords}
              type={currentTestCase.type}
              temporaryId={temporaryIdRef.current}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
            />
            <PipelineSelect
              type={currentTestCase.type}
              selectedEvaluator={currentTestCase.evaluator}
              setSelectedEvaluator={onSetSelectedPipeline}
              evaluatorOptions={isRisksAndHarms ? graniteGuardianEvaluators || [] : nonGraniteGuardianEvaluators || []}
              title={'Evaluator'}
              style={{ marginBottom: '2rem' }}
              className={classes['left-padding']}
            />
            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>
            <TestDataTable
              currentTestCase={currentTestCase}
              setInstances={setInstances}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              type={currentTestCase.type}
              evaluationRunning={evaluationRunning}
              setSelectedInstance={setSelectedInstance}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              criteria={currentTestCase.criteria}
              responseVariableName={currentTestCase.responseVariableName}
              setResponseVariableName={(responseVariableName) =>
                setCurrentTestCase((previousCurrentUseCase) =>
                  previousCurrentUseCase !== null ? { ...previousCurrentUseCase, responseVariableName } : null,
                )
              }
              loadingSyntheticExamples={loadingSyntheticExamples}
              setSysntheticGenerationModalOpen={setSysntheticGenerationModalOpen}
              generateTestData={() =>
                generateTestData({
                  credentials: modelProviderCredentials[modelForSyntheticGeneration?.provider as ModelProviderType],
                  evaluatorName: modelForSyntheticGeneration?.name!,
                  provider: modelForSyntheticGeneration?.provider!,
                })
              }
              modelForSyntheticGeneration={modelForSyntheticGeneration}
            />
            <EvaluateButton
              evaluationRunning={evaluationRunning}
              runEvaluation={runEvaluation}
              areRelevantCredentialsProvided={areRelevantCredentialsProvided}
              className={classes['left-padding']}
              setPromptModalOpen={setPromptModalOpen}
              currentUseCase={currentTestCase}
              evaluationFailed={evaluationFailed}
            />
          </>
        )}
      </div>
      <NewUseCaseModal
        open={newUseCaseModalOpen}
        setOpen={setNewUseCaseModalOpen}
        changesDetected={changesDetected}
        updateURLFromUseCase={updateURLFromUseCase}
      />
      {currentTestCase !== null && (
        <>
          <SwitchUseCaseModal
            updateURLFromUseCase={updateURLFromUseCase}
            open={confirmationModalOpen}
            setOpen={setConfirmationModalOpen}
            selectedUseCase={useCaseSelected}
            currentUseCase={currentTestCase}
            onSave={onSave}
            setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
            evaluationRunning={evaluationRunning}
            setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
            setLibraryUseCaseSelected={setUseCaseSelected}
          />
          <SaveAsUseCaseModal
            type={currentTestCase.type}
            open={saveUseCaseModalOpen}
            setOpen={setSaveUseCaseModalOpen}
            onSaveAs={onSaveAs}
          />

          <DeleteUseCaseModal
            open={deleteUseCaseModalOpen}
            setOpen={setDeleteUseCaseModalOpen}
            onDeleteUseCase={onDeleteUseCase}
            useCaseName={currentTestCase.name}
          />
          <EditUseCaseNameModal
            open={editNameModalOpen}
            setOpen={setEditNameModalOpen}
            name={currentTestCase.name}
            setName={(name) =>
              setCurrentTestCase((previousCurrentUseCase) =>
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
          <InstanceDetailsModal
            open={resultDetailsModalOpen}
            setOpen={setResultDetailsModalOpen}
            selectedInstance={selectedInstance}
            setSelectedInstance={setSelectedInstance}
            type={currentTestCase.type}
            responseVariableName={currentTestCase.responseVariableName}
          />
          <PromptModal
            open={promptModalOpen}
            setOpen={setPromptModalOpen}
            currentUseCase={currentTestCase}
            modelProviderCredentials={modelProviderCredentials}
          />
          <SyntheticGenerationModal
            open={sysntheticGenerationModalOpen}
            setOpen={setSysntheticGenerationModalOpen}
            modelForSyntheticGeneration={modelForSyntheticGeneration}
            setModelForSyntheticGeneration={setModelForSyntheticGeneration}
            type={currentTestCase.type}
            generateTestData={() =>
              generateTestData({
                credentials: modelProviderCredentials[modelForSyntheticGeneration?.provider as ModelProviderType],
                evaluatorName: modelForSyntheticGeneration?.name!,
                provider: modelForSyntheticGeneration?.provider!,
              })
            }
          />
          <ChooseCodeGenerationType
            open={sampleCodeTypeModalOpen}
            setOpen={setSampleCodeTypeModalOpen}
            downloadUnitxtCode={downloadUnitxtCode}
          />
        </>
      )}
    </>
  )
}
