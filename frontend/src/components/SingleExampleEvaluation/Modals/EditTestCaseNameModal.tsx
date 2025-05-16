import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { TestCase } from '../../../types'
import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import { useUserUseCasesContext } from '../Providers/UserUseCasesProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const EditTestCaseNameModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const { userUseCases, setUserUseCases } = useUserUseCasesContext()

  const [newUseCaseName, setNewUseCaseName] = useState(currentTestCase.name)

  useEffect(() => {
    setNewUseCaseName(currentTestCase.name)
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
