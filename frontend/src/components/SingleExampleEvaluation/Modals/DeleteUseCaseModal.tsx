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
  const [status, setStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>('inactive')
  const [description, setDescription] = useState('Deleting...')

  const resetStatus = () => {
    setStatus('active')
    setDescription('Deleting...')
    setOpen(false)
  }

  const onSubmit = async () => {
    await onDeleteUseCase()
    setOpen(false)
    resetStatus()
  }

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Delete workspace '${useCaseName}'`}
      primaryButtonText="Delete"
      danger
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      loadingStatus={status}
      shouldSubmitOnEnter
      loadingDescription={description}
      onLoadingSuccess={resetStatus}
    >
      <p>{`This action will permanently delete the current test case.`}</p>
    </Modal>
  )
}
