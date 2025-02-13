import { Dispatch, SetStateAction } from 'react'

import { Button, ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { UseCase } from '../../../types'

interface Props {
  updateURLFromUseCase: (
    selectedUseCase: {
      useCase: UseCase
      subCatalogName: string | null
    } | null,
  ) => void
  selectedUseCase: {
    useCase: UseCase
    subCatalogName: string | null
  } | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  changesDetected: boolean
}

export const EvaluationRunningModal = ({
  open,
  setOpen,
  updateURLFromUseCase,
  selectedUseCase,
  setConfirmationModalOpen,
  changesDetected,
}: Props) => {
  const onClose = () => {
    setOpen(false)
  }

  const onContinue = async () => {
    if (changesDetected) {
      setConfirmationModalOpen(true)
    } else {
      updateURLFromUseCase(selectedUseCase)
    }
    setOpen(false)
  }

  return (
    selectedUseCase && (
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
