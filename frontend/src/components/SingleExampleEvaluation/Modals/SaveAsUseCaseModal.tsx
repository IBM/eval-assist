import { Dispatch, SetStateAction, useState } from 'react'

import { useRouter } from 'next/router'

import { Modal, TextInput } from '@carbon/react'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: (name: string) => Promise<void>
}

export const SaveAsUseCaseModal = ({ open, setOpen, onSaveAs }: Props) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const [useCaseName, setUseCaseName] = useState('')
  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Save Use Case`}
      primaryButtonText="Confirm"
      primaryButtonDisabled={savingUseCase}
      secondaryButtonText="Cancel"
      onRequestSubmit={async (e) => {
        setSavingUseCase(true)
        await onSaveAs(useCaseName)
        setUseCaseName('')
        setSavingUseCase(false)
        setOpen(false)
      }}
      shouldSubmitOnEnter
    >
      <TextInput
        value={useCaseName}
        onChange={(e: any) => setUseCaseName(e.target.value)}
        id={'save-as-text-input'}
        labelText={'Name'}
        autoFocus
      />
    </Modal>
  )
}
