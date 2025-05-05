import { Dispatch, SetStateAction } from 'react'

import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { TestCase } from '../../../types'
import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import { useModelProviderCredentials } from '../Providers/ModelProviderCredentialsProvider'

interface Props {
  updateURLFromUseCase: (
    selectedUseCase: {
      useCase: TestCase
      subCatalogName: string | null
    } | null,
  ) => void
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
}

export const EvaluationRunningModal = ({ open, setOpen, updateURLFromUseCase, setConfirmationModalOpen }: Props) => {
  const {} = useModelProviderCredentials()
  const { changesDetected, testCaseSelected } = useCurrentTestCase()

  const onClose = () => {
    setOpen(false)
  }

  const onContinue = async () => {
    if (changesDetected) {
      setConfirmationModalOpen(true)
    } else {
      updateURLFromUseCase(testCaseSelected)
    }
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
