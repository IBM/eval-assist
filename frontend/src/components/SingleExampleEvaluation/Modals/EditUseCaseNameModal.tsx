import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Modal, TextInput } from '@carbon/react'

import { UseCase } from '../../../types'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  name: string
  setName: (name: string) => void
  userUseCases: UseCase[]
  setUserUseCases: Dispatch<SetStateAction<UseCase[]>>
}

export const EditUseCaseNameModal = ({ open, setOpen, name, setName, userUseCases, setUserUseCases }: Props) => {
  const [newUseCaseName, setNewUseCaseName] = useState(name)
  useEffect(() => {
    setNewUseCaseName(name)
  }, [name])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Change use case name`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={(e) => {
        setOpen(false)
        setName(newUseCaseName)
        setUserUseCases([
          ...userUseCases.filter((u) => u.name !== name),
          {
            ...(userUseCases.find((u) => u.name === name) as UseCase),
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
