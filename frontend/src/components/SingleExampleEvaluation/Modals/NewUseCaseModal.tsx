import { Dispatch, SetStateAction } from 'react'

import { useRouter } from 'next/router'

import { Modal } from '@carbon/react'

import { getEmptyUseCase } from '@utils/utils'

import { UseCase } from '../types'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setCurrentUseCase: (useCase: UseCase) => void
}

export const NewUseCaseModal = ({ open, setOpen, setCurrentUseCase }: Props) => {
  const router = useRouter()
  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Start working with a new use case`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        setCurrentUseCase(getEmptyUseCase())
        setOpen(false)
      }}
      shouldSubmitOnEnter
    >
      <p>{`This action will replace your ongoing work with a blank new use case.`}</p>
    </Modal>
  )
}
