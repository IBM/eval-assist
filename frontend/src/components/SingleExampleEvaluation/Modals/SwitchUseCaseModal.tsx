import { Dispatch, SetStateAction, useState } from 'react'

import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setEvaluationRunningModalOpen: Dispatch<SetStateAction<boolean>>
}

export const SwitchUseCaseModal = ({
  open,
  setOpen,
  setSaveUseCaseModalOpen,
  setEvaluationRunningModalOpen,
}: Props) => {
  const { onSave, evaluationRunning } = useTestCaseActionsContext()
  const [saving, setSaving] = useState(false)
  const { currentTestCase, setTestCaseSelected, testCaseSelected, updateURLFromTestCase } = useCurrentTestCase()

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
      updateURLFromTestCase(testCaseSelected)
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
    onClose()
    if (evaluationRunning) {
      setEvaluationRunningModalOpen(true)
    } else {
      updateURLFromTestCase(testCaseSelected)
    }
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
