import { Dispatch, SetStateAction, useCallback, useEffect } from 'react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { TestCase } from '@types'

interface Props {}

export const useSaveShortcut = ({}: Props) => {
  const { isTestCaseSaved, changesDetected } = useCurrentTestCase()
  const { onSave } = useTestCaseActionsContext()
  const { setSaveUseCaseModalOpen } = useModalsContext()
  const onShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 's' && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault()
        if (isTestCaseSaved && changesDetected) {
          onSave()
        } else {
          setSaveUseCaseModalOpen(true)
        }
      }
    },
    [changesDetected, isTestCaseSaved, onSave, setSaveUseCaseModalOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', onShortcut)
    return () => document.removeEventListener('keydown', onShortcut)
  }, [isTestCaseSaved, onSave, onShortcut, setSaveUseCaseModalOpen])
}
