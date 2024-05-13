import { Dispatch, SetStateAction, useState } from 'react'

import { useRouter } from 'next/router'

import { Modal } from '@carbon/react'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onDeleteUseCase: () => Promise<void>
  useCaseName: string
}

export const DeleteUseCaseModal = ({ open, setOpen, onDeleteUseCase, useCaseName }: Props) => {
  const [deletingUseCase, setDeletingUseCase] = useState(false)
  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Delete workspace '${useCaseName}'`}
      primaryButtonText="Delete"
      danger
      primaryButtonDisabled={deletingUseCase}
      secondaryButtonText="Cancel"
      onRequestSubmit={async (e) => {
        setDeletingUseCase(true)
        await onDeleteUseCase()
        setOpen(false)
        setDeletingUseCase(false)
      }}
    >
      <p>{`This action will permanently delete the current use case.`}</p>
    </Modal>
  )
}
