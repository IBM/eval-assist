import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

import { Link, Modal, Select, SelectItem, TextInput } from '@carbon/react'

import { modelProviderBeautifiedName } from '@constants'
import { useAddCustomModel } from '@customHooks/useAddCustomModel'
import { useTestModelConnection } from '@customHooks/useTestModelConnection'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { ModelProviderType } from '@types'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const AddCustomModelModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const [customModelName, setCustomModelName] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [loading, setLoading] = useState(false)
  const { addCustomModel } = useAddCustomModel()
  const { testModelConnection } = useTestModelConnection()

  const onConfirm = useCallback(async () => {
    setLoading(true)
    await addCustomModel(customModelName, ModelProviderType.AWS)
    setLoading(false)
    setOpen(false)
    setSelectedProvider('')
    setCustomModelName('')
  }, [addCustomModel, customModelName, selectedProvider, setOpen])

  return (
    <Modal
      open={open}
      onRequestClose={() => setOpen(false)}
      modalHeading={`Add custom model`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={onConfirm}
      shouldSubmitOnEnter
    >
      <p style={{ marginBottom: '1rem' }}>Add a custom model to a provider</p>
      <Select
        id={'provider-select'}
        labelText={'Provider'}
        value={selectedProvider}
        onChange={(e) => {
          setSelectedProvider(e.target.value)
        }}
      >
        {Object.keys(ModelProviderType).map((p, i) => (
          <SelectItem text={p} value={p} key={i} />
        ))}
      </Select>
      <TextInput
        autoFocus
        value={customModelName}
        onChange={(e: any) => setCustomModelName(e.target.value)}
        id={'new-custom-model-text-input'}
        labelText={'Custom model name'}
      />
      <Link onClick={() => testModelConnection(ModelProviderType.RITS, customModelName)}>Test</Link>
    </Modal>
  )
}
