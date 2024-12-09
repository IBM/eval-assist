import { Dispatch, SetStateAction, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { EvaluationType, UseCase } from '../../../types'
import { UseCaseTypeBadge } from '../../UseCaseTypeBadge/UseCaseTypeBadge'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: (name: string, fromUseCase?: UseCase) => Promise<boolean>
  type: EvaluationType
}

export const SaveAsUseCaseModal = ({ open, setOpen, onSaveAs, type }: Props) => {
  const [useCaseName, setUseCaseName] = useState('')
  const [loadingStatus, setLoadingStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>(
    'inactive',
  )
  const [loadingDescription, setLoadingDescription] = useState('Saving...')

  const resetStatus = () => {
    setLoadingStatus('inactive')
    setOpen(false)
    setUseCaseName('')
  }

  const onSubmit = async () => {
    setLoadingStatus('active')
    const failed = !(await onSaveAs(useCaseName))
    setLoadingStatus(failed ? 'inactive' : 'finished')
    setLoadingDescription(failed ? 'Saving...' : 'Saved!')
  }

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          Save Test Case <UseCaseTypeBadge style={{ marginLeft: '1rem' }} type={type} />
        </div>
      }
      primaryButtonText="Confirm"
      onRequestSubmit={onSubmit}
      loadingStatus={loadingStatus}
      loadingDescription={loadingDescription}
      secondaryButtonText="Cancel"
      shouldSubmitOnEnter
      onLoadingSuccess={resetStatus}
      primaryButtonDisabled={useCaseName === ''}
    >
      <TextInput
        data-modal-primary-focus
        value={useCaseName}
        onChange={(e: any) => setUseCaseName(e.target.value)}
        id={'save-as-text-input'}
        labelText={'Name'}
      />
    </Modal>
  )
}
