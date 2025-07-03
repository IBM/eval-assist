import { Dispatch, SetStateAction, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { TestCaseTypeBadge } from '@components/TestCaseTypeBadge/TestCaseTypeBadge'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const SaveAsTestCaseModal = ({ open, setOpen }: Props) => {
  const [testCaseName, setTestCaseName] = useState('')
  const { currentTestCase } = useCurrentTestCase()
  const [loadingStatus, setLoadingStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>(
    'inactive',
  )
  const [loadingDescription, setLoadingDescription] = useState('Saving...')
  const { onSaveAs } = useTestCaseActionsContext()

  const resetStatus = () => {
    setLoadingStatus('inactive')
    setOpen(false)
    setTestCaseName('')
  }

  const onSubmit = async () => {
    setLoadingStatus('active')
    const failed = !(await onSaveAs(testCaseName))
    setLoadingStatus(failed ? 'inactive' : 'finished')
    setLoadingDescription(failed ? 'Saving...' : 'Saved!')
  }

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          Save Test Case <TestCaseTypeBadge style={{ marginLeft: '1rem' }} type={currentTestCase.type} />
        </div>
      }
      primaryButtonText="Confirm"
      onRequestSubmit={onSubmit}
      loadingStatus={loadingStatus}
      loadingDescription={loadingDescription}
      secondaryButtonText="Cancel"
      shouldSubmitOnEnter
      onLoadingSuccess={resetStatus}
      primaryButtonDisabled={testCaseName === ''}
    >
      <TextInput
        data-modal-primary-focus
        value={testCaseName}
        onChange={(e: any) => setTestCaseName(e.target.value)}
        id={'save-as-text-input'}
        labelText={'Name'}
      />
    </Modal>
  )
}
