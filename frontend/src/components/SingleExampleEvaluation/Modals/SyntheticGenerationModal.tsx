import { modelProviderBeautifiedName } from 'src/constants'

import { Dispatch, SetStateAction, useCallback } from 'react'

import { ComposedModal, ModalBody, ModalFooter, ModalHeader } from '@carbon/react'
import { AiLabel } from '@carbon/react/icons'

import { EvaluationType, Evaluator } from '@types'

import { PipelineSelect } from '../EvaluatorSelect'
import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  type: EvaluationType
  modelForSyntheticGeneration: Evaluator | null
  setModelForSyntheticGeneration: Dispatch<SetStateAction<Evaluator | null>>
  generateTestData: () => Promise<void>
}

export const SyntheticGenerationModal = ({
  open,
  setOpen,
  type,
  modelForSyntheticGeneration,
  setModelForSyntheticGeneration,
  generateTestData,
}: Props) => {
  const onRequestSubmit = useCallback(() => {
    setOpen(false)
    generateTestData()
  }, [generateTestData, setOpen])

  const { nonGraniteGuardianEvaluators } = usePipelineTypesContext()

  return (
    <ComposedModal open={open} onClose={() => setOpen(false)} decorator={<AiLabel size={32} />}>
      <ModalHeader title="Generate synthetic example" />
      <ModalBody>
        <p
          style={{
            marginBottom: '1rem',
          }}
        >
          This process will create a sysnthetically generated example and it will be added to the Test Data table. The
          generated example is intended to be a <strong>borderline example</strong>, meaning that neither of the options
          criteria can be accuratelly be used to label it. Use it to help you iterate and improve your criteria
          definition.
        </p>

        <PipelineSelect
          type={type}
          selectedEvaluator={modelForSyntheticGeneration}
          setSelectedEvaluator={setModelForSyntheticGeneration}
          evaluatorOptions={nonGraniteGuardianEvaluators || []}
          style={{ marginBottom: '2rem' }}
          title={'Model for synthetic generation'}
        />
      </ModalBody>

      <ModalFooter
        primaryButtonText="Generate"
        secondaryButtonText="Cancel"
        onRequestSubmit={onRequestSubmit}
        primaryButtonDisabled={modelForSyntheticGeneration === null}
      >
        <></>
      </ModalFooter>
    </ComposedModal>
  )
}
