import cx from 'classnames'

import { Dispatch, SetStateAction, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

import { Column, Grid, Layer, Modal, Row, TextInput } from '@carbon/react'

import { getEmptyUseCase } from '@utils/utils'

import { PipelineOptionCard } from '../PipelineOptionCard'
import { usePipelineTypesContext } from '../PipelineTypesProvider'
import { PipelineType, UseCase } from '../types'
import classes from './NewUseCaseModal.module.scss'

interface Props {
  open: boolean
  changesDetected: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  onSaveAs: (name: string, fromUseCase?: UseCase) => Promise<void>
}

export const NewUseCaseModal = ({ open, changesDetected, setOpen, onSaveAs }: Props) => {
  const [selectedType, setSelectedType] = useState<PipelineType | null>(null)
  const [name, setName] = useState('')

  const [status, setStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>('inactive')
  const [description, setDescription] = useState('Deleting...')

  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const sm = useMediaQuery({ query: '(max-width: 671px)' })

  const onSubmit = async () => {
    setStatus('active')
    await onSaveAs(name, {
      ...getEmptyUseCase(selectedType as PipelineType),
      pipeline: selectedType === PipelineType.RUBRIC ? rubricPipelines[0] : pairwisePipelines[0],
    })
    setStatus('finished')
    setDescription('Created!')
  }

  const onTypeChange = ({ index }: { index?: number }) => {
    const newType = index === 0 ? PipelineType.RUBRIC : PipelineType.PAIRWISE
    setSelectedType(newType)
  }

  const resetStatus = () => {
    setStatus('inactive')
    setDescription('Creating...')
    setOpen(false)
    setName('')
  }

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={`Create a new Test Case`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      onSecondarySubmit={resetStatus}
      shouldSubmitOnEnter
      primaryButtonDisabled={name === '' || selectedType === null}
      loadingDescription={description}
      onLoadingSuccess={resetStatus}
      loadingStatus={status}
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <TextInput
          data-modal-primary-focus
          id="text-input-1"
          labelText="Name"
          placeholder="My test case"
          style={{
            marginBottom: '1.5rem',
          }}
          onChange={(e) => {
            setName(e.target.value)
          }}
          value={name}
        />
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
