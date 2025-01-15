import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'

import { UseCase } from '../types'
import { useFetchUtils } from './useFetchUtils'

interface Props {
  criteria: UseCase['criteria'] | undefined
  model_name: string | undefined
  responses: UseCase['responses'] | undefined
  contextVariables: UseCase['contextVariables'] | undefined
}
export const useUnitxtNotebook = ({ criteria, model_name, responses, contextVariables: contexts }: Props) => {
  const { post } = useFetchUtils()
  const { addToast } = useToastContext()

  const downloadUnitxtNotebook = async () => {
    if (!criteria || !model_name || !responses || !contexts) return
    try {
      const response = await post('download-notebook/', {
        criteria,
        model_name,
        responses,
        contexts,
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
