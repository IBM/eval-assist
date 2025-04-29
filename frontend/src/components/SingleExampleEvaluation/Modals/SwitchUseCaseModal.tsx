import { Dispatch, SetStateAction, useState } from 'react'

import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { UseCase } from '../../../types'
import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'

interface Props {
  updateURLFromUseCase: (useCaseSelected: { useCase: UseCase; subCatalogName: string | null } | null) => void
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSave: () => Promise<void>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
  setEvaluationRunningModalOpen: Dispatch<SetStateAction<boolean>>
}

export const SwitchUseCaseModal = ({
  open,
  setOpen,
  updateURLFromUseCase,
  onSave,
  setSaveUseCaseModalOpen,
  evaluationRunning,
  setEvaluationRunningModalOpen,
}: Props) => {
  const [saving, setSaving] = useState(false)
  const { currentTestCase, setTestCaseSelected, testCaseSelected } = useCurrentTestCase()

  const onClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setTestCaseSelected(null)
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
      updateURLFromUseCase(testCaseSelected)
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
    updateURLFromUseCase(testCaseSelected)
    setOpen(false)
  }

  return (
    testCaseSelected && (
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
            onClick={() => (currentTestCase.id === null ? onSaveAsClick() : onSaveClick())}
          >
            {!saving ? (currentTestCase.id === null ? 'Save as' : 'Save') : 'Saving...'}
          </Button>
        </ModalFooter>
      </ComposedModal>
    )
  )
}
