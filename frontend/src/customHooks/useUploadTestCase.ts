import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useToastContext } from '@providers/ToastProvider'
import { TestCase } from '@types'

import { useParseFetchedTestCase } from './useParseFetchedTestCase'

export const useUploadTestCase = () => {
  const { addToast, removeToast } = useToastContext()
  const { currentTestCase } = useCurrentTestCase()
  const { parseFetchedTestCase } = useParseFetchedTestCase()

  const uploadTestCase = async () => {
    const inProgressToastId = addToast({
      kind: 'info',
      title: 'Downloading test case...',
      timeout: 5000,
    })
    const parsedSavedTestCase = parseFetchedTestCase(savedTestCase) as TestCase
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
      removeToast(inProgressToastId)
      addToast({
        kind: 'success',
        title: 'Sample notebook generated succesfully',
        timeout: 5000,
      })
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
