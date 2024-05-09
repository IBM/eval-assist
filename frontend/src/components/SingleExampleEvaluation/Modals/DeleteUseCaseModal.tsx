import { Dispatch, SetStateAction } from 'react'

import { Modal } from '@carbon/react'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onDeleteUseCase: () => void
  useCaseName: string
}

export const DeleteUseCaseModal = ({ open, setOpen, onDeleteUseCase, useCaseName }: Props) => {
  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Delete workspace '${useCaseName}'`}
      primaryButtonText="Delete"
      danger
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        onDeleteUseCase()
        setOpen(false)
      }}
    >
      <p>{`This action will permanently delete the current use case.`}</p>
    </Modal>
  )
}
