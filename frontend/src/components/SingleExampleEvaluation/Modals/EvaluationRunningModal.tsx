import { Dispatch, SetStateAction, useState } from 'react'

import { useRouter } from 'next/router'

import { Button, ComposedModal, Modal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'

import { UseCase } from '../../../utils/types'

interface Props {
  setCurrentUseCase: (useCase: UseCase) => void
  selectedUseCase: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  changesDetected: boolean
}

export const EvaluationRunningModal = ({
  open,
  setOpen,
  setCurrentUseCase,
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
      setCurrentUseCase(selectedUseCase as UseCase)
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
