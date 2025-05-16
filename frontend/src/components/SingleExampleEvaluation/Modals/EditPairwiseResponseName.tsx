import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import classes from './EditPairwiseResponseName.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const EditPairwiseResponseName = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()

  const [responseVariableName, setResponseVariableName] = useState(currentTestCase.responseVariableName)

  useEffect(() => {
    setResponseVariableName(currentTestCase.responseVariableName)
  }, [currentTestCase.responseVariableName])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Change response name`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        setCurrentTestCase({ ...currentTestCase, responseVariableName })
        setOpen(false)
      }}
      shouldSubmitOnEnter
    >
      <p style={{ marginBottom: '1rem' }}>Select the name of the responses that will be compared</p>

      <TextInput
        autoFocus
        value={responseVariableName}
        onChange={(e: any) => setResponseVariableName(e.target.value)}
        id={'new-use-case-name-text-input'}
        labelText={'New name'}
      />
      <p className={classes.note}>Note: this will change the name of all the responses</p>
    </Modal>
  )
}
