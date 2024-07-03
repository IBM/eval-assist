import { Dispatch, SetStateAction, useCallback, useEffect } from 'react'

import { UseCase } from '@utils/types'

interface Props {
  onSave: () => Promise<void>
  isUseCaseSaved: boolean
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  changesDetected: boolean
}

export const useSaveShortcut = ({ onSave, isUseCaseSaved, changesDetected, setSaveUseCaseModalOpen }: Props) => {
  const onShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 's' && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault()
        if (isUseCaseSaved && changesDetected) {
          onSave()
        } else {
          setSaveUseCaseModalOpen(true)
        }
      }
    },
    [changesDetected, isUseCaseSaved, onSave, setSaveUseCaseModalOpen],
  )

  useEffect(() => {
    document.addEventListener('keydown', onShortcut)
    return () => document.removeEventListener('keydown', onShortcut)
  }, [isUseCaseSaved, onSave, onShortcut, setSaveUseCaseModalOpen])
}
