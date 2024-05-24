import cx from 'classnames'

import { Dispatch, SetStateAction, useState } from 'react'

import { Layer, Modal } from '@carbon/react'

import { getEmptyUseCase } from '@utils/utils'

import { PipelineOptionCard } from '../Card/PipelineOptionCard'
import { usePipelineTypesContext } from '../PipelineTypesProvider'
import { PipelineType, UseCase } from '../types'
import classes from './NewUseCaseModal.module.scss'

interface Props {
  open: boolean
  changesDetected: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  setCurrentUseCase: (useCase: UseCase) => void
}

export const NewUseCaseModal = ({ open, changesDetected, setOpen, setCurrentUseCase }: Props) => {
  const [selectedType, setSelectedType] = useState<PipelineType | null>(null)

  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const onSubmit = async () => {
    setCurrentUseCase({
      ...getEmptyUseCase(selectedType as PipelineType),
      pipeline: selectedType === PipelineType.RUBRIC ? rubricPipelines[0] : pairwisePipelines[0],
    })
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
            type={PipelineType.RUBRIC}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
          />
          <PipelineOptionCard
            type={PipelineType.PAIRWISE}
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
