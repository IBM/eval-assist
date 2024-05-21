import { Dispatch, SetStateAction } from 'react'

import { useRouter } from 'next/router'

import { Modal } from '@carbon/react'

import { UseCase } from '../types'

interface Props {
  setCurrentUseCase: (useCase: UseCase) => void
  selectedUseCase: UseCase | null
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const SwitchUseCaseModal = ({ open, setOpen, setCurrentUseCase, selectedUseCase }: Props) => {
  return (
    selectedUseCase && (
      <Modal
        open={open}
        onRequestClose={() => setOpen(false)}
        modalHeading={`Start working with the '${selectedUseCase.name}' use case`}
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        shouldSubmitOnEnter
        onRequestSubmit={(e) => {
          setOpen(false)
          setCurrentUseCase(selectedUseCase)
        }}
      >
        <p>{`This action will replace your ongoing work with the selected test case.`}</p>
      </Modal>
    )
  )
}
