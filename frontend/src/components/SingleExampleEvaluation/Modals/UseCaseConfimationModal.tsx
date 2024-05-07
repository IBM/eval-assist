import { Dispatch, SetStateAction } from 'react'

import { Modal } from '@carbon/react'

import { UseCase } from '../types'

interface Props {
  setUseCase: (useCase: UseCase) => void
  libraryUseCaseSelected: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setIsSideNavExpanded: Dispatch<SetStateAction<boolean>>
}

export const UseCaseConfirmationModal = ({
  open,
  setOpen,
  setUseCase,
  libraryUseCaseSelected,
  setIsSideNavExpanded,
}: Props) => {
  return (
    libraryUseCaseSelected && (
      <Modal
        open={open}
        onRequestClose={() => setOpen(false)}
        modalHeading={`Start working with the '${libraryUseCaseSelected.name}' use case`}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onRequestSubmit={(e) => {
          setOpen(false)
          setIsSideNavExpanded(false)
          setUseCase(libraryUseCaseSelected)
        }}
      >
        <p>{`This action will replace your ongoing work with the selected use case.`}</p>
      </Modal>
    )
  )
}
