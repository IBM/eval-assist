import { useCallback, useEffect } from 'react'

import { useAppSidebarContext } from '@providers/AppSidebarProvider'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useFeatureFlags } from '@providers/FeatureFlagsProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'

interface Props {}

export const useShortcuts = ({}: Props) => {
  const { isTestCaseSaved, changesDetected } = useCurrentTestCase()
  const { storageEnabled } = useFeatureFlags()
  const { onSave } = useTestCaseActionsContext()
  const { setSaveTestCaseModalOpen } = useModalsContext()
  const { sidebarTabSelected, setSidebarTabSelected } = useAppSidebarContext()
  const onShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 's' && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault()
        if (isTestCaseSaved && changesDetected) {
          onSave()
        } else {
          setSaveTestCaseModalOpen(true)
        }
      } else if (e.key === 'b' && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault()
        setSidebarTabSelected(sidebarTabSelected === null ? 'library_test_cases' : null)
      }
    },
    [changesDetected, isTestCaseSaved, onSave, setSaveTestCaseModalOpen, sidebarTabSelected, setSidebarTabSelected],
  )

  useEffect(() => {
    if (storageEnabled) {
      document.addEventListener('keydown', onShortcut)
      return () => document.removeEventListener('keydown', onShortcut)
    }
  }, [isTestCaseSaved, onSave, onShortcut, setSaveTestCaseModalOpen, storageEnabled])
}
