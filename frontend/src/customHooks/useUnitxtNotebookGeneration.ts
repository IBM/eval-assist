import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'

import { DirectInstance, EvaluationType, Instance, PairwiseInstance, UseCase } from '../types'
import { useFetchUtils } from './useFetchUtils'

interface Props {
  testCaseName: UseCase['name']
  criteria: UseCase['criteria']
  evaluatorName: string | null
  responses: DirectInstance['response'][] | PairwiseInstance['responses'][]
  contextVariablesList: Instance['contextVariables'][]
  // @ts-ignore
  // tslint says UseCase['evaluator'] can be null, but it can't be null
  provider: UseCase['evaluator']['provider']
  credential_keys: string[]
  evaluatorType: EvaluationType
}
export const useUnitxtNotebookGeneration = ({
  criteria,
  evaluatorName,
  responses,
  contextVariablesList,
  provider,
  credential_keys,
  evaluatorType,
  testCaseName,
}: Props) => {
  const { post } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()

  const downloadUnitxtNotebook = async () => {
    if (!evaluatorName) {
      addToast({
        kind: 'warning',
        title: 'Select an evaluator in order to generate a notebook',
      })
      return
    }
    const inProgressToastId = addToast({
      kind: 'info',
      title: 'Generating Jupyter notebook...',
      timeout: 5000,
    })
    try {
      const response = await post('download-notebook/', {
        criteria,
        evaluator_name: evaluatorName,
        predictions: responses || [],
        context_variables:
          contextVariablesList.map((contextVariables) =>
            contextVariables.reduce((acc, item, index) => ({ ...acc, [item.name]: item.value }), {}),
          ) || {},
        provider,
        credentials: credential_keys.reduce((acc, item, index) => ({ ...acc, [item]: '' }), {}),
        evaluator_type: evaluatorType!,
        test_case_name: testCaseName || '',
      })

      if (!response.ok) {
        addToast({
          kind: 'error',
          title: 'Sample notebook download failed',
          timeout: 5000,
        })
      }
      const notebookBlob = await response.blob()
      const url = window.URL.createObjectURL(notebookBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'generated_notebook.ipynb'
      document.body.appendChild(link)
      link.click()

      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)
      removeToast(inProgressToastId)
      addToast({
        kind: 'success',
        title: 'Sample notebook generated succesfully',
        timeout: 5000,
      })
    } catch {
      addToast({
        kind: 'error',
        title: 'Sample notebook download failed',
        timeout: 5000,
      })
    }
  }

  return {
    downloadUnitxtNotebook,
  }
}
