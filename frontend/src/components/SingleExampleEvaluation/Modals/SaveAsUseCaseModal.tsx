import { Dispatch, SetStateAction, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: () => Promise<void>
  testCaseName: string
  setUseCaseName: Dispatch<SetStateAction<string>>
}

export const SaveAsUseCaseModal = ({ open, setOpen, onSaveAs, setUseCaseName, testCaseName }: Props) => {
  const [savingUseCase, setSavingUseCase] = useState(false)

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
        await onSaveAs()
        setSavingUseCase(false)
        setOpen(false)
      }}
    >
      <TextInput
        value={testCaseName}
        onChange={(e: any) => setUseCaseName(e.target.value)}
        id={''}
        labelText={'Name'}
      ></TextInput>
    </Modal>
  )
}
