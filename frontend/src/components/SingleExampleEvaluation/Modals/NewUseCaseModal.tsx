import cx from 'classnames'

import { Dispatch, SetStateAction, useState } from 'react'

import { Layer, Modal } from '@carbon/react'

import { getEmptyUseCase } from '@utils/utils'

import { EvaluationType, UseCase } from '../../../types'
import { PipelineOptionCard } from '../Card/PipelineOptionCard'
import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'
import { useToastContext } from '../Providers/ToastProvider'
import classes from './NewUseCaseModal.module.scss'

interface Props {
  open: boolean
  changesDetected: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  updateURLFromUseCase: (useCaseSelected: { useCase: UseCase; subCatalogName: string | null }) => void
}

export const NewUseCaseModal = ({ open, changesDetected, setOpen, updateURLFromUseCase }: Props) => {
  const [selectedType, setSelectedType] = useState<EvaluationType | null>(null)

  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const { addToast } = useToastContext()

  const onSubmit = async () => {
    if (rubricPipelines !== null && pairwisePipelines !== null) {
      updateURLFromUseCase({
        useCase: {
          ...getEmptyUseCase(selectedType as EvaluationType),
          evaluator: selectedType === EvaluationType.RUBRIC ? rubricPipelines[0] : pairwisePipelines[0],
        },
        subCatalogName: null,
      })
    } else {
      updateURLFromUseCase({ useCase: getEmptyUseCase(selectedType as EvaluationType), subCatalogName: null })
      addToast({
        kind: 'info',
        title: 'Evaluator options are not yet available',
        subtitle: 'Choose an option once they are ready',
        timeout: 5000,
      })
    }
    resetStatus()
  }

  const resetStatus = () => {
    setOpen(false)
    setSelectedType(null)
  }

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={`Create a new Test Case`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      shouldSubmitOnEnter
      primaryButtonDisabled={selectedType === null}
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <p className={'cds--label'}>Select an Evaluation Method</p>
        <div className={classes.cards}>
          <PipelineOptionCard
            type={EvaluationType.RUBRIC}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
          <PipelineOptionCard
            type={EvaluationType.PAIRWISE}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
        </div>
        {changesDetected && (
          <span
            className={classes['danger-text']}
          >{`This action will replace your ongoing work with a blank new test case`}</span>
        )}
      </Layer>
    </Modal>
  )
}
