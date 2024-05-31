import { Dispatch, SetStateAction, useState } from 'react'

import { useRouter } from 'next/router'

import { Button, ComposedModal, Modal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { UseCase } from '../types'

interface Props {
  setCurrentUseCase: (useCase: UseCase) => void
  selectedUseCase: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentUseCase: UseCase
  onSave: () => Promise<void>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
  setEvaluationRunningModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
}

export const SwitchUseCaseModal = ({
  open,
  setOpen,
  setCurrentUseCase,
  currentUseCase,
  selectedUseCase,
  onSave,
  setSaveUseCaseModalOpen,
  evaluationRunning,
  setEvaluationRunningModalOpen,
  setLibraryUseCaseSelected,
}: Props) => {
  const [saving, setSaving] = useState(false)
  const onClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setLibraryUseCaseSelected(null)
    onClose()
  }

  const onSaveClick = async () => {
    setSaving(true)
    await onSave()
    setSaving(false)
    onClose()
    if (evaluationRunning) {
      setEvaluationRunningModalOpen(true)
    } else {
      setCurrentUseCase(selectedUseCase as UseCase)
    }
  }

  const onSaveAsClick = () => {
    setSaveUseCaseModalOpen(true)
    onClose()
    if (evaluationRunning) {
      setEvaluationRunningModalOpen(true)
    }
  }

  const onDontSave = async () => {
    setCurrentUseCase(selectedUseCase as UseCase)
    setOpen(false)
  }

  return (
    selectedUseCase && (
      <ComposedModal size="sm" open={open} onClose={onClose}>
        <ModalHeader title={'Save before leaving?'} />
        <ModalBody>
          <p>{'Your test case has unsaved changes, which will be lost, if you continue without saving.'}</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="ghost" onClick={onCancel}>
            Cancel
          </Button>

          <Button kind="secondary" disabled={saving} onClick={onDontSave}>{`Don't save`}</Button>

          <Button
            kind="primary"
            disabled={saving}
            onClick={() => (currentUseCase.id === null ? onSaveAsClick() : onSaveClick())}
          >
            {!saving ? (currentUseCase.id === null ? 'Save as' : 'Save') : 'Saving...'}
          </Button>
        </ModalFooter>
      </ComposedModal>
    )
  )
}
