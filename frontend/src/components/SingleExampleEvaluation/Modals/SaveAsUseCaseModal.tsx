import { Dispatch, SetStateAction, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { UseCaseTypeBadge } from '../UseCaseTypeBadge'
import { PipelineType, UseCase } from '../types'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: (name: string, fromUseCase?: UseCase) => Promise<void>
  type: PipelineType
}

export const SaveAsUseCaseModal = ({ open, setOpen, onSaveAs, type }: Props) => {
  const [useCaseName, setUseCaseName] = useState('')
  const [status, setStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>('inactive')
  const [description, setDescription] = useState('Deleting...')

  const resetStatus = () => {
    setStatus('inactive')
    setDescription('Deleting...')
    setOpen(false)
    setUseCaseName('')
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
      onRequestSubmit={async () => {
        setStatus('active')
        await onSaveAs(useCaseName)
        setStatus('finished')
        setDescription('Saved!')
      }}
      loadingStatus={status}
      secondaryButtonText="Cancel"
      shouldSubmitOnEnter
      loadingDescription={description}
      onLoadingSuccess={resetStatus}
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
