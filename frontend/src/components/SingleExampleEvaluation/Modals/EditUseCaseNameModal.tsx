import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { TestCase } from '../../../types'
import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  userUseCases: TestCase[]
  setUserUseCases: Dispatch<SetStateAction<TestCase[]>>
}

export const EditUseCaseNameModal = ({ open, setOpen, userUseCases, setUserUseCases }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()

  const [newUseCaseName, setNewUseCaseName] = useState(currentTestCase.name)

  useEffect(() => {
    setNewUseCaseName(currentTestCase.name)
  }, [currentTestCase.name])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Change use case name`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        setOpen(false)
        setCurrentTestCase({ ...currentTestCase, name: newUseCaseName })
        setUserUseCases([
          ...userUseCases.filter((u) => u.name !== currentTestCase.name),
          {
            ...(userUseCases.find((u) => u.name === currentTestCase.name) as TestCase),
            name: newUseCaseName,
          },
        ])
      }}
      shouldSubmitOnEnter
    >
      <TextInput
        autoFocus
        value={newUseCaseName}
        onChange={(e: any) => setNewUseCaseName(e.target.value)}
        id={'new-use-case-name-text-input'}
        labelText={'New name'}
      />
    </Modal>
  )
}
