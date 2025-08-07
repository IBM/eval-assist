import { v4 as uuid } from 'uuid'

import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useParseFetchedTestCase } from '@customHooks/useParseFetchedTestCase'
import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  FetchedDirectInstanceResultWithId,
  FetchedDirectResults,
  FetchedPairwiseResults,
  FetchedTestCase,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
  TestCase,
} from '@types'
import { parseCriteriaForBackend, returnByPipelineType, toSnakeCase } from '@utils'

import { useAppSidebarContext } from './AppSidebarProvider'
import { useCriteriasContext } from './CriteriaProvider'
import { useCurrentTestCase } from './CurrentTestCaseProvider'
import { useModelProviderCredentials } from './ModelProviderCredentialsProvider'
import { useToastContext } from './ToastProvider'
import { useURLParamsContext } from './URLParamsProvider'
import { useUserTestCasesContext } from './UserTestCasesProvider'

interface TestCaseActionsContextValue {
  runEvaluation: (evaluationIds: string[]) => Promise<void>
  onSave: () => Promise<void>
  onSaveAs: (name: string, fromTestCase?: TestCase | undefined) => Promise<boolean>
  onDeleteTestCase: () => Promise<void>
  evaluationRunning: boolean
  evaluationFailed: boolean
  evaluatingInstanceIds: string[]
  cancelEvaluation: () => void
}

const TestCaseActionsContext = createContext<TestCaseActionsContextValue>({
  runEvaluation: () => Promise.resolve(),
  onSave: () => Promise.resolve(),
  onSaveAs: () => Promise.resolve(true),
  onDeleteTestCase: () => Promise.resolve(),
  cancelEvaluation: () => {},
  evaluationRunning: false,
  evaluationFailed: false,
  evaluatingInstanceIds: [],
})

export const useTestCaseActionsContext = () => {
  return useContext(TestCaseActionsContext)
}

export const TestCaseActionsProvider = ({ children }: { children: ReactNode }) => {
  const { addToast, removeToast } = useToastContext()
  const {
    currentTestCase,
    setCurrentTestCase,
    setLastSavedTestCaseString,
    currentTestCaseString,
    testCaseSelected,
    getStringifiedInstanceContent,
    setInstancesLastEvaluatedContent,
    updateURLFromTestCase,
  } = useCurrentTestCase()
  const [evaluationRunningToastId, setEvaluationRunningToastId] = useState<string | null>(null)
  const temporaryIdRef = useRef(uuid())
  const { isRisksAndHarms, changeTestCaseURL } = useURLParamsContext()
  const { getCriteria } = useCriteriasContext()
  const [evaluationRunning, setEvaluationRunning] = useState(false)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluatingInstanceIds, setEvaluatingInstanceIds] = useState<string[]>([])
  const { getProviderCredentialsWithDefaults } = useModelProviderCredentials()
  const { deleteCustom, post, put } = useFetchUtils()
  const isEqualToCurrentTemporaryId = useCallback((id: string) => temporaryIdRef.current === id, [temporaryIdRef])
  const { parseFetchedTestCase, CURRENT_FORMAT_VERSION } = useParseFetchedTestCase()
  const { getUserName } = useAuthentication()
  const { userTestCases: userTestCases, setUserTestCases: setUserTestCases } = useUserTestCasesContext()
  const { setSidebarTabSelected } = useAppSidebarContext()
  const [inProgressEvalToastId, setInProgressEvalToastId] = useState<string | null>(null)

  const cancelEvaluation = useCallback(() => {
    temporaryIdRef.current = uuid()
    setEvaluationRunning(false)
    addToast({
      kind: 'info',
      title: 'The evaluation was canceled',
      timeout: 5000,
    })
    if (inProgressEvalToastId) {
      removeToast(inProgressEvalToastId)
    }
    setEvaluatingInstanceIds([])
  }, [addToast, inProgressEvalToastId, removeToast])

  const runEvaluation = useCallback(
    async (evaluationIds: string[]) => {
      if (currentTestCase === null) return
      const inProgressEvalToastId = addToast({
        title: 'Running evaluation...',
        kind: 'info',
      })
      setInProgressEvalToastId(inProgressEvalToastId)
      setEvaluationRunningToastId(inProgressEvalToastId)
      // temporaryIdSnapshot is used to discern whether the current test case
      // was changed during the evaluation request
      const temporaryIdSnapshot = temporaryIdRef.current
      let response
      const parsedCriteria = parseCriteriaForBackend(currentTestCase.criteria)

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

      const toEvaluateInstances: Instance[] = currentTestCase.instances
        .filter((instance) => evaluationIds.includes(instance.id))
        .filter((instance) =>
          returnByPipelineType(
            currentTestCase.type,
            () => (instance as DirectInstance).response !== '',
            () => (instance as PairwiseInstance).responses.some((r) => r !== ''),
          ),
        )

      const toEvaluateInstancesParsed = toEvaluateInstances.map((instance) => ({
        context_variables: instance.contextVariables.reduce(
          (acc, item, index) => ({ ...acc, [item.name]: item.value }),
          {},
        ),
        [returnByPipelineType(currentTestCase.type, 'response', 'responses')]: returnByPipelineType(
          currentTestCase.type,
          () => (instance as DirectInstance).response,
          () => (instance as PairwiseInstance).responses,
        ),
        id: instance.id,
        expected_result: instance.expectedResult,
        is_synthetic: instance.metadata?.synthetic_generation ? true : false,
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
      }
      body['llm_provider_credentials'] = getProviderCredentialsWithDefaults(currentTestCase.evaluator!.provider)

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
                metadata: fetchedInstanceResult.result.metadata,
              }
              updatedInstances.find((instance) => instance.id === fetchedInstanceResult.id)!.result = instanceResult
            },
          )
        } else {
          ;(responseBody.results as FetchedPairwiseResults).forEach((fetchedInstanceResult, i) => {
            let instanceResult: PairwiseInstanceResult = {}
            Object.entries(fetchedInstanceResult.result).forEach(([result_idx, fetchedPerResponseResult]) => {
              instanceResult[result_idx] = {
                contestResults: fetchedPerResponseResult.contest_results,
                comparedTo: fetchedPerResponseResult.compared_to,
                explanations: fetchedPerResponseResult.explanations,
                positionalBias:
                  fetchedPerResponseResult.positional_bias ||
                  new Array(fetchedPerResponseResult.contest_results.length).fill(false),
                winrate: fetchedPerResponseResult.winrate,
                ranking: fetchedPerResponseResult.ranking,
              }
            })
            updatedInstances.find((instance) => instance.id === fetchedInstanceResult.id)!.result = instanceResult
          })
        }
        setCurrentTestCase((prev) => {
          // used to filter the instances to update if one or more instances were deleted while the evaluation was running
          const currentInstanceIds = prev.instances.map((i) => i.id)
          return {
            ...currentTestCase,
            instances: updatedInstances.filter((ui) => currentInstanceIds.includes(ui.id)),
          }
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
      getProviderCredentialsWithDefaults,
      getStringifiedInstanceContent,
      isEqualToCurrentTemporaryId,
      isRisksAndHarms,
      post,
      removeToast,
      setCurrentTestCase,
      setInstancesLastEvaluatedContent,
    ],
  )

  const onSave = useCallback(async () => {
    if (currentTestCase === null) return
    const savedTestCase: FetchedTestCase = await (
      await put('test_case/', {
        test_case: {
          name: currentTestCase.name,
          content: JSON.stringify({
            instances: currentTestCase.instances,
            criteria: currentTestCase.criteria,
            type: currentTestCase.type,
            evaluator: currentTestCase.evaluator,
            syntheticGenerationConfig: currentTestCase.syntheticGenerationConfig,
            contentFormatVersion: CURRENT_FORMAT_VERSION,
          }),
          user_id: -1,
          id: currentTestCase.id,
        } as FetchedTestCase,
        user: getUserName(),
      })
    ).json()

    const parsedSavedTestCase = parseFetchedTestCase(savedTestCase) as TestCase

    setCurrentTestCase(parsedSavedTestCase)
    // update test case in the test cases list
    const i = userTestCases.findIndex((testCase) => testCase.id === currentTestCase.id)
    setUserTestCases([...userTestCases.slice(0, i), parsedSavedTestCase, ...userTestCases.slice(i + 1)])

    // update lastSavedTestCase
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
    parseFetchedTestCase,
    put,
    setCurrentTestCase,
    setLastSavedTestCaseString,
    setUserTestCases,
    userTestCases,
  ])

  const onSaveAs = useCallback(
    async (name: string, fromTestCase?: TestCase) => {
      if (currentTestCase === null) return false
      const toSaveTestCase = fromTestCase ?? currentTestCase
      const res = await put('test_case/', {
        test_case: {
          name: name,
          content: JSON.stringify({
            instances: currentTestCase.instances,
            evaluator: toSaveTestCase.evaluator,
            criteria: toSaveTestCase.criteria,
            type: toSaveTestCase.type,
            pipeline: toSaveTestCase.evaluator,
            syntheticGenerationConfig: currentTestCase.syntheticGenerationConfig,
            contentFormatVersion: CURRENT_FORMAT_VERSION,
          }),
          user_id: -1,
          id: -1,
        } as FetchedTestCase,
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
        const savedTestCase: FetchedTestCase = await res.json()
        const parsedSavedTestCase = parseFetchedTestCase(savedTestCase) as TestCase
        // testCaseSelected will be different from null when
        // save as is done before switching from an unsaved
        // test case that has changes detected
        // if testCaseSelected is different from null
        // a rediction will be done to that selected test case
        if (testCaseSelected === null) {
          updateURLFromTestCase({ testCase: parsedSavedTestCase, subCatalogName: null })
          setSidebarTabSelected('user_test_cases')
        } else {
          updateURLFromTestCase(testCaseSelected)
        }
        setUserTestCases([...userTestCases, parsedSavedTestCase])

        // notify the user
        addToast({
          kind: 'success',
          title: `Created test case '${parsedSavedTestCase.name}'`,
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
      parseFetchedTestCase,
      put,
      setSidebarTabSelected,
      setUserTestCases,
      testCaseSelected,
      updateURLFromTestCase,
      userTestCases,
    ],
  )

  const onDeleteTestCase = async () => {
    await deleteCustom('test_case/', { test_case_id: currentTestCase.id })

    // notify the user
    addToast({
      kind: 'success',
      title: `Deleted test case '${currentTestCase.name}'`,
      timeout: 5000,
    })

    setUserTestCases(userTestCases.filter((u) => u.id !== currentTestCase.id))
    changeTestCaseURL(null)
  }

  return (
    <TestCaseActionsContext.Provider
      value={{
        runEvaluation,
        onSave,
        onSaveAs,
        onDeleteTestCase,
        cancelEvaluation,
        evaluationRunning,
        evaluationFailed,
        evaluatingInstanceIds,
      }}
    >
      {children}
    </TestCaseActionsContext.Provider>
  )
}
