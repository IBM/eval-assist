import { Dispatch, SetStateAction, useState } from 'react'

import { Modal } from '@carbon/react'

import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '../Providers/TestCaseActionsProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const DeleteUseCaseModal = ({ open, setOpen }: Props) => {
  const { currentTestCase } = useCurrentTestCase()
  const { onDeleteTestCase } = useTestCaseActionsContext()
  const [loadingStatus, setLoadingStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>(
    'inactive',
  )
  const [description, setDescription] = useState('Deleting...')

  const resetStatus = () => {
    setLoadingStatus('inactive')
    setDescription('Deleting...')
    setOpen(false)
  }

  const onSubmit = async () => {
    setLoadingStatus('active')
    await onDeleteTestCase()
    setLoadingStatus('finished')
    setDescription('Deleted')
    setOpen(false)
    resetStatus()
  }

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Delete workspace '${currentTestCase.name}'`}
      primaryButtonText="Delete"
      danger
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      loadingStatus={loadingStatus}
      shouldSubmitOnEnter
      loadingDescription={description}
      onLoadingSuccess={resetStatus}
    >
      <p>{`This action will permanently delete the current test case.`}</p>
    </Modal>
  )
}
