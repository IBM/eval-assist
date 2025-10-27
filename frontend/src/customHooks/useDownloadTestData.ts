import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useToastContext } from '@providers/ToastProvider'
import { parseCriteriaForBackend, parseInstanceForBackend } from '@utils'

import { useFetchUtils } from './useFetchUtils'

export const useDownloadTestData = () => {
  const { post } = useFetchUtils()
  const { addToast } = useToastContext()
  const { currentTestCase } = useCurrentTestCase()

  const downloadTestData = async () => {
    const instances = currentTestCase.instances.map((i) => parseInstanceForBackend(i, currentTestCase.type))
    const criteria = parseCriteriaForBackend(currentTestCase.criteria)

    try {
      const response = await post('download-test-data/', {
        instances,
        to_evaluate_field: criteria.to_evaluate_field,
      })

      if (!response.ok) {
        addToast({
          kind: 'error',
          title: 'Downloading test data failed',
          timeout: 5000,
        })
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentTestCase.name ? currentTestCase.name + '_' : ''}eval_assist_test_data.csv`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      addToast({
        kind: 'error',
        title: 'Downloading test data failed',
        timeout: 5000,
      })
    }
  }

  return {
    downloadTestData,
  }
}
