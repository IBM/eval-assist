import { Dispatch, SetStateAction } from 'react'

import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const EvaluationRunningModal = ({ open, setOpen }: Props) => {
  const { cancelEvaluation } = useTestCaseActionsContext()
  const { changesDetected, testCaseSelected, updateURLFromTestCase } = useCurrentTestCase()

  const onClose = () => {
    setOpen(false)
  }

  const onContinue = async () => {
    updateURLFromTestCase(testCaseSelected)
    cancelEvaluation()
    setOpen(false)
  }

  return (
    testCaseSelected && (
      <ComposedModal size="sm" open={open} onClose={onClose}>
        <ModalHeader title={'Evaluation is still running'} />
        <ModalBody>
          <p>{'If you continue, the running evaluation results will be lost.'}</p>
        </ModalBody>
        <ModalFooter>
          <Button kind="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button kind="primary" onClick={onContinue}>
            {'Continue'}
          </Button>
        </ModalFooter>
      </ComposedModal>
    )
  )
}
