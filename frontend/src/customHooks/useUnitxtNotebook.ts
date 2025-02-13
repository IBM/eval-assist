import { returnByPipelineType } from 'src/utils'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'

import { DirectInstance, EvaluationType, Instance, PairwiseInstance, UseCase } from '../types'
import { useFetchUtils } from './useFetchUtils'

interface Props {
  testCaseName: UseCase['name'] | undefined
  criteria: UseCase['criteria'] | undefined
  evaluatorName: string | undefined
  responses: DirectInstance['response'][] | PairwiseInstance['responses'][] | undefined
  contextVariablesList: Instance['contextVariables'][] | undefined
  // @ts-ignore
  // tslint says UseCase['evaluator'] can be null, but it can't be null
  provider: UseCase['evaluator']['provider'] | undefined
  credentials: { [key: string]: string } | undefined
  evaluatorType: EvaluationType | undefined
}
export const useUnitxtNotebook = ({
  criteria,
  evaluatorName,
  responses,
  contextVariablesList,
  provider,
  credentials,
  evaluatorType,
  testCaseName,
}: Props) => {
  const { post } = useFetchUtils()
  const { addToast } = useToastContext()

  const downloadUnitxtNotebook = async () => {
    if (!testCaseName || !criteria || !evaluatorName || !responses || !contextVariablesList || !provider) return
    const parsedContextVariablesList = contextVariablesList.map((contextVariables) =>
      contextVariables.reduce((acc, item, index) => ({ ...acc, [item.name]: item.value }), {}),
    )
    try {
      const response = await post('download-notebook/', {
        criteria,
        evaluator_name: evaluatorName,
        predictions: responses,
        context_variables: parsedContextVariablesList,
        provider,
        credentials,
        evaluator_type: evaluatorType,
        test_case_name: testCaseName,
      })

      if (!response.ok) {
        addToast({
          kind: 'error',
          title: 'Sample notebook download failed',
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
    } catch {
      addToast({
        kind: 'error',
        title: 'Sample notebook download failed',
      })
    }
  }

  return {
    downloadUnitxtNotebook,
  }
}
