import { Dispatch, SetStateAction, useState } from 'react'

import { ContentSwitcher, Layer, Modal, Switch, TextInput } from '@carbon/react'

import { getEmptyUseCase } from '@utils/utils'

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
  const [selectedType, setSelectedType] = useState<PipelineType>(PipelineType.RUBRIC)
  const [name, setName] = useState('')

  const [status, setStatus] = useState<'inactive' | 'active' | 'finished' | 'error' | undefined>('inactive')
  const [description, setDescription] = useState('Deleting...')

  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const onSubmit = async () => {
    setStatus('active')
    await onSaveAs(name, {
      ...getEmptyUseCase(selectedType),
      pipeline: selectedType === PipelineType.RUBRIC ? rubricPipelines[0] : pairwisePipelines[0],
    })
    setStatus('finished')
    setDescription('Saved!')
  }

  const onTypeChange = ({ index }: { index?: number }) => {
    const newType = index === 0 ? PipelineType.RUBRIC : PipelineType.PAIRWISE
    setSelectedType(newType)
  }

  const resetStatus = () => {
    setStatus('inactive')
    setDescription('Deleting...')
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
      primaryButtonDisabled={name === ''}
      loadingDescription={description}
      onLoadingSuccess={resetStatus}
      loadingStatus={status}
      className={classes['bottom-padding']}
    >
      <Layer>
        <TextInput
          data-modal-primary-focus
          id="text-input-1"
          labelText="Test Case name"
          placeholder="My test case"
          style={{
            marginBottom: '1.5rem',
          }}
          onChange={(e) => {
            setName(e.target.value)
          }}
          value={name}
        />
        <p className={'cds--label'}>Test Case type</p>
        <ContentSwitcher
          onChange={onTypeChange}
          selectedIndex={0}
          size="sm"
          style={{ width: '24rem', marginBottom: '2rem' }}
        >
          <Switch name={'Direct Assessment'} text={'Direct Assessment'} />
          <Switch name={'Pairwise Ranking'} text={'Pairwise Ranking'} />
        </ContentSwitcher>
        {changesDetected && (
          <span
            className={classes['danger-text']}
          >{`This action will replace your ongoing work with a blank new test case`}</span>
        )}
      </Layer>
    </Modal>
  )
}
