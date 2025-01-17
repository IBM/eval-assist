import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'

import { EvaluationType, UseCase } from '../types'
import { useFetchUtils } from './useFetchUtils'

interface Props {
  criteria: UseCase['criteria'] | undefined
  evaluatorName: string | undefined
  responses: UseCase['responses'] | undefined
  contextVariables: UseCase['contextVariables'] | undefined
  // @ts-ignore
  // tslint says UseCase['evaluator'] can be null, but it can't be null
  provider: UseCase['evaluator']['provider'] | undefined
  credentials: { [key: string]: string } | undefined
  evaluator_type: EvaluationType | undefined
}
export const useUnitxtNotebook = ({
  criteria,
  evaluatorName,
  responses,
  contextVariables,
  provider,
  credentials,
  evaluator_type,
}: Props) => {
  const { post } = useFetchUtils()
  const { addToast } = useToastContext()

  const downloadUnitxtNotebook = async () => {
    if (!criteria || !evaluatorName || !responses || !contextVariables || !provider) return
    try {
      const response = await post('download-notebook/', {
        criteria,
        evaluator_name: evaluatorName,
        responses,
        context_variables: contextVariables,
        provider,
        credentials,
        evaluator_type,
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
