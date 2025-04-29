import { Dispatch, SetStateAction, useCallback, useEffect } from 'react'

import { UseCase } from '@types'

interface Props {
  onSave: () => Promise<void>
  isTestCaseSaved: boolean
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  changesDetected: boolean
}

export const useSaveShortcut = ({ onSave, isTestCaseSaved, changesDetected, setSaveUseCaseModalOpen }: Props) => {
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
