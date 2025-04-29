import cx from 'classnames'
import { getJSONStringWithSortedKeys, returnByPipelineType, stringifyQueryParams, toSnakeCase } from 'src/utils'
import { v4 as uuid } from 'uuid'

import { LegacyRef, useCallback, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/router'

import { Button, IconButton } from '@carbon/react'
import { Add, WarningFilled } from '@carbon/react/icons'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import { useAuthentication } from '@customHooks/useAuthentication'
import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'
import { useParseFetchedUseCase } from '@customHooks/useParseFetchedUseCase'
import { useSaveShortcut } from '@customHooks/useSaveShortcut'
import { useUnitxtCodeGeneration } from '@customHooks/useUnitxtNotebookGeneration'
import { StoredUseCase } from '@prisma/client'

import {
  DirectInstance,
  DirectInstanceResult,
  DomainEnum,
  EvaluationType,
  Evaluator,
  FetchedDirectInstanceResult,
  FetchedDirectInstanceResultWithId,
  FetchedDirectResults,
  FetchedPairwiseInstanceResult,
  FetchedPairwiseResults,
  GenerationLengthEnum,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  PairwiseInstanceResult,
  SyntheticGenerationConfig,
  UseCase,
} from '../../types'
import { APIKeyPopover } from './APIKeyPopover'
import { AppSidenavNew } from './AppSidenav/AppSidenav'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { PipelineSelect } from './EvaluatorSelect'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { ChooseCodeGenerationType } from './Modals/ChooseCodeGenerationType'
import { DeleteUseCaseModal } from './Modals/DeleteUseCaseModal'
import { EditUseCaseNameModal } from './Modals/EditUseCaseNameModal'
import { EvaluationRunningModal } from './Modals/EvaluationRunningModal'
import { InstanceDetailsModal } from './Modals/InstanceDetailsModal'
import { ModelProviderCredentialsModal } from './Modals/ModelProviderCredentialsModal'
import { NewUseCaseModal } from './Modals/NewUseCaseModal'
import { PromptModal } from './Modals/PromptModal'
import { SaveAsUseCaseModal } from './Modals/SaveAsUseCaseModal'
import { SwitchUseCaseModal } from './Modals/SwitchUseCaseModal'
import { SyntheticGenerationModal } from './Modals/SyntheticGenerationModal'
import { useAppSidebarContext } from './Providers/AppSidebarProvider'
import { useCriteriasContext } from './Providers/CriteriasProvider'
import { useCurrentTestCase } from './Providers/CurrentTestCaseProvider'
import { useEvaluatorOptionsContext } from './Providers/EvaluatorOptionsProvider'
import { useModelProviderCredentials } from './Providers/ModelProviderCredentialsProvider'
import { useSyntheticGeneration } from './Providers/SyntheticGenerationProvider'
import { useURLParamsContext } from './Providers/URLParamsProvider'
import { useUserUseCasesContext } from './Providers/UserUseCasesProvider'
import classes from './SingleExampleEvaluation.module.scss'
import { TestCaseOptions } from './TestCaseOptions'
import { TestDataTable } from './TestDataTable'

export const SingleExampleEvaluation = () => {
  const {
    preloadedTestCase,
    currentTestCase,
    setCurrentTestCase,
    changesDetected,
    isTestCaseSaved,
    setLastSavedTestCaseString,
    currentTestCaseString,
    testCaseSelected,
    showingTestCase,
    getStringifiedInstanceContent,
    setInstancesLastEvaluatedContent,
  } = useCurrentTestCase()
  const { userUseCases, setUserUseCases } = useUserUseCasesContext()
  // we are ignoring client side rendering to be able to use useSessionStorage
  const { areRelevantCredentialsProvided } = useCurrentTestCase()

  const { isRisksAndHarms } = useURLParamsContext()

  // if the usecase doesnt have an id, it means it hasn't been stored
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationRunning, setEvaluationRunning] = useState(false)
  const [evaluatingInstanceIds, setEvaluatingInstanceIds] = useState<string[]>([])
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [saveUseCaseModalOpen, setSaveUseCaseModalOpen] = useState(false)
  const [newUseCaseModalOpen, setNewUseCaseModalOpen] = useState(false)
  const [deleteUseCaseModalOpen, setDeleteUseCaseModalOpen] = useState(false)
  const [editNameModalOpen, setEditNameModalOpen] = useState(false)
  const [resultDetailsModalOpen, setResultDetailsModalOpen] = useState(false)
  const [evaluationRunningModalOpen, setEvaluationRunningModalOpen] = useState(false)
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [syntheticGenerationModalOpen, setSyntheticGenerationModalOpen] = useState(false)
  const [sampleCodeTypeModalOpen, setSampleCodeTypeModalOpen] = useState(false)
  const [modelProviderCrendentialsModelOpen, setModelProviderCrendentialsModelOpen] = useState(false)

  const { setSidebarTabSelected } = useAppSidebarContext()

  const toHighlightWords = useMemo(() => {
    return showingTestCase
      ? {
          contextVariables: currentTestCase?.instances[0]?.contextVariables.map((c) => c.name) || [],
          responseVariableName: currentTestCase.responseVariableName,
        }
      : {
          contextVariables: [],
          responseVariableName: '',
        }
  }, [currentTestCase?.instances, currentTestCase.responseVariableName, showingTestCase])

  const { modelProviderCredentials } = useModelProviderCredentials()

  const { nonGraniteGuardianDirectEvaluators, nonGraniteGuardianPairwiseEvaluators, graniteGuardianEvaluators } =
    useEvaluatorOptionsContext()

  const evaluatorOptions = useMemo(
    () =>
      isRisksAndHarms
        ? graniteGuardianEvaluators || []
        : returnByPipelineType(
            currentTestCase.type,
            nonGraniteGuardianDirectEvaluators,
            nonGraniteGuardianPairwiseEvaluators,
          ) || [],
    [
      currentTestCase.type,
      graniteGuardianEvaluators,
      isRisksAndHarms,
      nonGraniteGuardianDirectEvaluators,
      nonGraniteGuardianPairwiseEvaluators,
    ],
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
    () => currentTestCase?.contextVariableNames || [],
    [currentTestCase?.contextVariableNames],
  )

  // TODO: refactor so that this component receives a test case that cant be null
  const { loadingSyntheticExamples } = useSyntheticGeneration()

  const { downloadUnitxtCode } = useUnitxtCodeGeneration()

  const isEqualToCurrentTemporaryId = useCallback((id: string) => temporaryIdRef.current === id, [temporaryIdRef])

  const runEvaluation = useCallback(
    async (evaluationIds: string[]) => {
      if (currentTestCase === null) return
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
        if (
          harmsAndRiskCriteria !== null &&
          harmsAndRiskCriteria.description !== currentTestCase.criteria.description
        ) {
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

      const toEvaluateInstances: Instance[] = currentTestCase.instances.filter((instance) =>
        evaluationIds.includes(instance.id),
      )

      const toEvaluateInstancesParsed = toEvaluateInstances.map((instance) => ({
        context_variables: instance.contextVariables.reduce(
          (acc, item, index) => ({ ...acc, [item.name]: item.value }),
          {},
        ),
        response: returnByPipelineType(
          currentTestCase.type,
          () => (instance as DirectInstance).response,
          () => (instance as PairwiseInstance).responses,
        ),
        response_variable_name: currentTestCase.responseVariableName,
        id: instance.id,
      }))

      if (toEvaluateInstancesParsed.length === 0) {
        removeToast(inProgressEvalToastId)
        addToast({
          kind: 'info',
          title: 'No instances to evaluate',
          subtitle: 'All instances are already evaluated',
          timeout: 5000,
        })
        return
      }

      setEvaluationFailed(false)
      setEvaluationRunning(true)
      setEvaluatingInstanceIds(toEvaluateInstancesParsed.map((instance) => instance.id))

      let body: any = {
        instances: toEvaluateInstancesParsed,
        evaluator_name: currentTestCase.evaluator?.name,
        provider: currentTestCase.evaluator?.provider,
        criteria: parsedCriteria,
        type: currentTestCase.type,
        response_variable_name: currentTestCase.responseVariableName,
      }
      body['llm_provider_credentials'] = {
        ...modelProviderCredentials[currentTestCase.evaluator?.provider || ModelProviderType.RITS],
      }

      const startEvaluationTime = new Date().getTime() / 1000
      response = await post('evaluate/', body)
      setEvaluatingInstanceIds([])
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
            // timeout: 5000,
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
        let updatedInstances: Instance[] = currentTestCase.instances.map((instance) => ({ ...instance }))
        if (currentTestCase.type === EvaluationType.DIRECT) {
          ;(responseBody.results as FetchedDirectResults).forEach(
            (fetchedInstanceResult: FetchedDirectInstanceResultWithId, i) => {
              const instanceResult: DirectInstanceResult = {
                option: fetchedInstanceResult.result.option,
                positionalBiasOption: fetchedInstanceResult.result.positional_bias_option,
                explanation: fetchedInstanceResult.result.explanation,
                positionalBias: fetchedInstanceResult.result.positional_bias,
                certainty: fetchedInstanceResult.result.certainty,
              }
              updatedInstances.find((instance) => instance.id === fetchedInstanceResult.id)!.result = instanceResult
            },
          )
        } else {
          ;(responseBody.results as FetchedPairwiseResults).forEach(
            (fetchedInstanceResult: FetchedPairwiseInstanceResult, i) => {
              let instanceResult: PairwiseInstanceResult = {}
              Object.entries(fetchedInstanceResult.result).forEach(([result_idx, fetchedPerResponseResult]) => {
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
              updatedInstances.find((instance) => instance.id === fetchedInstanceResult.id)!.result = instanceResult
            },
          )
        }
        setCurrentTestCase({
          ...currentTestCase,
          instances: updatedInstances,
        })

        setInstancesLastEvaluatedContent(
          Object.fromEntries(
            updatedInstances.map((instance) => [instance.id, getStringifiedInstanceContent(instance)]),
          ),
        )

        removeToast(inProgressEvalToastId)
      }
    },
    [
      addToast,
      currentTestCase,
      getCriteria,
      getStringifiedInstanceContent,
      isEqualToCurrentTemporaryId,
      isRisksAndHarms,
      modelProviderCredentials,
      post,
      removeToast,
      setCurrentTestCase,
      setInstancesLastEvaluatedContent,
    ],
  )

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
            contextVariableNames: currentTestCase.contextVariableNames,
            responseVariableName: currentTestCase.responseVariableName,
            syntheticGenerationConfig: currentTestCase.syntheticGenerationConfig,
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
    setLastSavedTestCaseString(currentTestCaseString)

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
    currentTestCaseString,
    getUserName,
    parseFetchedUseCase,
    put,
    setCurrentTestCase,
    setLastSavedTestCaseString,
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
            contextVariableNames: currentTestCase.contextVariableNames,
            responseVariableName: currentTestCase.responseVariableName,
            syntheticGenerationConfig: currentTestCase.syntheticGenerationConfig,
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
        // a rediction will be done to that selected test case
        if (testCaseSelected === null) {
          updateURLFromUseCase({ useCase: parsedSavedUseCase, subCatalogName: null })
          setSidebarTabSelected('user_test_cases')
        } else {
          updateURLFromUseCase(testCaseSelected)
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
      testCaseSelected,
      updateURLFromUseCase,
      userUseCases,
    ],
  )

  useSaveShortcut({ onSave, changesDetected, setSaveUseCaseModalOpen, isTestCaseSaved })

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

  return (
    <>
      <AppSidenavNew
        setConfirmationModalOpen={setConfirmationModalOpen}
        userUseCases={userUseCases}
        updateURLFromUseCase={updateURLFromUseCase}
        evaluationRunning={evaluationRunning}
        setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
      />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        {!showingTestCase ? (
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
              <Button
                kind="tertiary"
                onClick={() => {
                  setNewUseCaseModalOpen(true)
                }}
                renderIcon={Add}
              >
                {'New Test Case'}
              </Button>
            </div>
            <TestCaseOptions
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              onSave={onSave}
              setNewUseCaseModalOpen={setNewUseCaseModalOpen}
              setDeleteUseCaseModalOpen={setDeleteUseCaseModalOpen}
              setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
              setEditNameModalOpen={setEditNameModalOpen}
              setSampleCodeTypeModalOpen={setSampleCodeTypeModalOpen}
            />
            <CriteriaView
              criteria={currentTestCase.criteria}
              setCriteria={(criteria) => setCurrentTestCase({ ...currentTestCase, criteria })}
              toHighlightWords={toHighlightWords}
              type={currentTestCase.type}
              temporaryId={temporaryIdRef.current}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
            />
            <div className={classes['left-padding']}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <strong>Model selection</strong>
                <Button
                  kind="tertiary"
                  onClick={() => setModelProviderCrendentialsModelOpen(true)}
                  iconDescription="Set api key"
                  renderIcon={!areRelevantCredentialsProvided ? WarningFilled : undefined}
                >
                  {'API credentials'}
                </Button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <PipelineSelect
                dropdownLabel={'Evaluator'}
                style={{ marginBottom: '2rem' }}
                className={classes['left-padding']}
                evaluationType={currentTestCase.type}
                evaluatorOptions={evaluatorOptions}
                selectedEvaluator={currentTestCase.evaluator}
                setSelectedEvaluator={(evaluator: Evaluator | null) => {
                  setCurrentTestCase({ ...currentTestCase, evaluator })
                }}
              />
              <PipelineSelect
                evaluationType={currentTestCase.syntheticGenerationConfig.evaluator?.type || EvaluationType.DIRECT}
                selectedEvaluator={currentTestCase.syntheticGenerationConfig.evaluator}
                setSelectedEvaluator={(newValue) =>
                  setCurrentTestCase({
                    ...currentTestCase,
                    syntheticGenerationConfig: {
                      ...currentTestCase.syntheticGenerationConfig,
                      evaluator: newValue,
                    },
                  })
                }
                evaluatorOptions={
                  returnByPipelineType(
                    currentTestCase.type,
                    nonGraniteGuardianDirectEvaluators,
                    nonGraniteGuardianPairwiseEvaluators,
                  ) || []
                }
                dropdownLabel={'Synthetic generation'}
                selectionComponentNameWithArticle="a model"
                selectionComponentName="model"
              />
            </div>
            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>
            <TestDataTable
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
              evaluationRunning={evaluationRunning}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              loadingSyntheticExamples={loadingSyntheticExamples}
              setSysntheticGenerationModalOpen={setSyntheticGenerationModalOpen}
              evaluatingInstanceIds={evaluatingInstanceIds}
              runEvaluation={runEvaluation}
            />
            <EvaluateButton
              evaluationRunning={evaluationRunning}
              runEvaluation={runEvaluation}
              className={classes['left-padding']}
              setPromptModalOpen={setPromptModalOpen}
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
      {showingTestCase && (
        <>
          <SwitchUseCaseModal
            updateURLFromUseCase={updateURLFromUseCase}
            open={confirmationModalOpen}
            setOpen={setConfirmationModalOpen}
            onSave={onSave}
            setSaveUseCaseModalOpen={setSaveUseCaseModalOpen}
            evaluationRunning={evaluationRunning}
            setEvaluationRunningModalOpen={setEvaluationRunningModalOpen}
          />
          <SaveAsUseCaseModal open={saveUseCaseModalOpen} setOpen={setSaveUseCaseModalOpen} onSaveAs={onSaveAs} />

          <DeleteUseCaseModal
            open={deleteUseCaseModalOpen}
            setOpen={setDeleteUseCaseModalOpen}
            onDeleteUseCase={onDeleteUseCase}
          />
          <EditUseCaseNameModal
            open={editNameModalOpen}
            setOpen={setEditNameModalOpen}
            userUseCases={userUseCases}
            setUserUseCases={setUserUseCases}
          />
          <EvaluationRunningModal
            open={evaluationRunningModalOpen}
            setOpen={setEvaluationRunningModalOpen}
            updateURLFromUseCase={updateURLFromUseCase}
            setConfirmationModalOpen={setConfirmationModalOpen}
          />
          <InstanceDetailsModal open={resultDetailsModalOpen} setOpen={setResultDetailsModalOpen} />
          <PromptModal open={promptModalOpen} setOpen={setPromptModalOpen} />
          {syntheticGenerationModalOpen && (
            <SyntheticGenerationModal open={syntheticGenerationModalOpen} setOpen={setSyntheticGenerationModalOpen} />
          )}
          <ChooseCodeGenerationType
            open={sampleCodeTypeModalOpen}
            setOpen={setSampleCodeTypeModalOpen}
            downloadUnitxtCode={downloadUnitxtCode}
          />
          <ModelProviderCredentialsModal
            open={modelProviderCrendentialsModelOpen}
            setOpen={setModelProviderCrendentialsModelOpen}
          />
        </>
      )}
    </>
  )
}
