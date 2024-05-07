import { Dispatch, SetStateAction, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: () => Promise<void>
  testCaseName: string
  setTestCaseName: Dispatch<SetStateAction<string>>
}

export const SaveTestCaseModal = ({ open, setOpen, onSaveAs, setTestCaseName, testCaseName }: Props) => {
  const [savingTestCase, setSavingTestCase] = useState(false)

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Save Use Case`}
      primaryButtonText="Confirm"
      primaryButtonDisabled={savingTestCase}
      secondaryButtonText="Cancel"
      onRequestSubmit={async (e) => {
        setSavingTestCase(true)
        await onSaveAs()
        setSavingTestCase(false)
        setOpen(false)
      }}
    >
      <TextInput
        value={testCaseName}
        onChange={(e: any) => setTestCaseName(e.target.value)}
        id={''}
        labelText={'Name'}
      ></TextInput>
    </Modal>
  )
}
