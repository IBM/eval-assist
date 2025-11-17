import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModelProviderCredentials } from '@providers/ModelProviderCredentialsProvider'
import { useToastContext } from '@providers/ToastProvider'
import { parseCriteriaForBackend, parseInstanceForBackend, returnByPipelineType } from '@utils'

import { DirectInstance, PairwiseInstance } from '../types'
import { useFetchUtils } from './useFetchUtils'

export const useUnitxtCodeGeneration = () => {
  const { post } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()
  const { getCredentialKeysFromProvider } = useModelProviderCredentials()
  const { currentTestCase } = useCurrentTestCase()
  const downloadUnitxtCode = async ({ downloadAsScript }: { downloadAsScript: boolean }) => {
    if (!currentTestCase.evaluator?.name) {
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
      const instances = currentTestCase.instances.map((i) => parseInstanceForBackend(i, currentTestCase.type))
      const examples = currentTestCase.examples.map((e) => parseInstanceForBackend(e, currentTestCase.type))
      const criteria = parseCriteriaForBackend(currentTestCase.criteria)

      const response = await post('download-notebook/', {
        criteria,
        evaluator_name: currentTestCase.evaluator.name,
        instances,
        examples,
        provider: currentTestCase.evaluator.provider,
        credentials: getCredentialKeysFromProvider(currentTestCase.evaluator.provider).reduce(
          (acc, item, index) => ({ ...acc, [item]: '' }),
          {},
        ),
        evaluator_type: currentTestCase.type,
        test_case_name: currentTestCase.name || '',
        plain_python_script: downloadAsScript,
        judge: currentTestCase.judge.name,
        judge_params: currentTestCase.judge.params,
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
      link.download = downloadAsScript ? 'generated_script.py' : 'generated_notebook.ipynb'
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
    downloadUnitxtCode,
  }
}
