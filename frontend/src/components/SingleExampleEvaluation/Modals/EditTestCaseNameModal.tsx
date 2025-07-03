import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useUserTestCasesContext } from '@providers/UserTestCasesProvider'

import { TestCase } from '../../../types'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const EditTestCaseNameModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { userTestCases: userTestCases, setUserTestCases: setUserTestCases } = useUserTestCasesContext()

  const [newTestCaseName, setNewTestCaseName] = useState(currentTestCase.name)

  useEffect(() => {
    setNewTestCaseName(currentTestCase.name)
  }, [currentTestCase.name])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Change test case name`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        setOpen(false)
        setCurrentTestCase({ ...currentTestCase, name: newTestCaseName })
        setUserTestCases([
          ...userTestCases.filter((u) => u.name !== currentTestCase.name),
          {
            ...(userTestCases.find((u) => u.name === currentTestCase.name) as TestCase),
            name: newTestCaseName,
          },
        ])
      }}
      shouldSubmitOnEnter
    >
      <TextInput
        autoFocus
        value={newTestCaseName}
        onChange={(e: any) => setNewTestCaseName(e.target.value)}
        id={'new-use-case-name-text-input'}
        labelText={'New name'}
      />
    </Modal>
  )
}
