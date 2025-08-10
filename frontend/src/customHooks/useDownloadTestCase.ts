import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useToastContext } from '@providers/ToastProvider'

import { useFetchUtils } from './useFetchUtils'

export const useDownloadTestCase = () => {
  const { post } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()
  const { currentTestCase } = useCurrentTestCase()
  const { getTestCaseAsJson } = useTestCaseActionsContext()

  const downloadTestCase = async () => {
    const parsedToDownloadTestCase = getTestCaseAsJson(currentTestCase)
    try {
      const response = await post('download-test-case/', {
        test_case: parsedToDownloadTestCase,
        user: null,
      })

      if (!response.ok) {
        addToast({
          kind: 'error',
          title: 'Downloading test case failed',
          timeout: 5000,
        })
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentTestCase.name}_eval_assist_test_case.json`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      addToast({
        kind: 'error',
        title: 'Downloading test case failed',
        timeout: 5000,
      })
    }
  }

  return {
    downloadTestCase,
  }
}
