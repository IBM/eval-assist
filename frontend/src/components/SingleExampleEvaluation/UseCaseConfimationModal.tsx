import { Dispatch, SetStateAction } from 'react'

import { Modal } from '@carbon/react'

import { UseCase } from './UseCases'

interface Props {
  setUseCase: (useCase: UseCase) => void
  useCaseSelected: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const UseCaseConfirmationModal = ({ open, setOpen, setUseCase, useCaseSelected }: Props) => {
  return (
    useCaseSelected && (
      <Modal
        open={open}
        onRequestClose={() => setOpen(false)}
        modalHeading={`Start working with the '${useCaseSelected.name}' use case`}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestSubmit={(e) => {
          setOpen(false)
          setUseCase(useCaseSelected)
        }}
      >
        <p>{`This action will replace your ongoing work with the selected use case.`}</p>
      </Modal>
    )
  )
}
