import { toTitleCase } from 'src/utils'

import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton } from '@carbon/react'
import { Add, Download, Edit, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'

import { EvaluationType } from '../../types'
import { UseCaseTypeBadge } from '../UseCaseTypeBadge/UseCaseTypeBadge'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import classes from './UseCaseOptions.module.scss'

interface UseCaseOptionsProps {
  style?: CSSProperties
  className?: string
  isUseCaseSaved: boolean
  useCaseName: string
  type: EvaluationType
  changesDetected: boolean
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setDeleteUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setUseCaseName: (name: string) => void
  setEditNameModalOpen: Dispatch<SetStateAction<boolean>>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  downloadUnitxtNotebook: () => Promise<void>
  setSampleCodeTypeModalOpen: Dispatch<SetStateAction<boolean>>
}

export const UseCaseOptions = ({
  style,
  className,
  useCaseName,
  type,
  isUseCaseSaved,
  setSaveUseCaseModalOpen,
  onSave,
  setNewUseCaseModalOpen,
  changesDetected,
  setDeleteUseCaseModalOpen,
  setEditNameModalOpen,
  downloadUnitxtNotebook,
  setSampleCodeTypeModalOpen,
}: UseCaseOptionsProps) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const { isRisksAndHarms } = useURLInfoContext()
  const onSaveClick = async () => {
    setSavingUseCase(true)
    await onSave()
    setSavingUseCase(false)
  }
  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'row', alignItems: 'center' }} className={className}>
      <h4
        style={{
          paddingRight: '0.5rem',
          opacity: useCaseName ? 'inherit' : '0.5',
        }}
      >
        {toTitleCase(useCaseName) || 'Unsaved test case'}
      </h4>
      {isUseCaseSaved && (
        <IconButton
          style={{ marginRight: '0.5rem' }}
          kind={'ghost'}
          label="Edit name"
          onClick={() => setEditNameModalOpen(true)}
        >
          <Edit />
        </IconButton>
      )}
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <UseCaseTypeBadge type={type} style={{ paddingInline: '0.5rem' }} />
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      {isUseCaseSaved ? (
        <>
          <Button
            disabled={savingUseCase || !changesDetected || isRisksAndHarms}
            kind="ghost"
            renderIcon={Save}
            onClick={onSaveClick}
          >
            {'Save'}
          </Button>
          <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
        </>
      ) : null}

      <Button
        disabled={isRisksAndHarms}
        kind="ghost"
        renderIcon={WatsonHealthSaveImage}
        onClick={() => setSaveUseCaseModalOpen(true)}
      >
        {'Save as'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button
        kind="ghost"
        renderIcon={Add}
        onClick={() => {
          setNewUseCaseModalOpen(true)
        }}
      >
        {'New Test Case'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button
        kind="ghost"
        renderIcon={TrashCan}
        disabled={!isUseCaseSaved}
        onClick={() => {
          setDeleteUseCaseModalOpen(true)
        }}
      >
        {'Delete Test Case'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button
        disabled={isRisksAndHarms}
        kind="ghost"
        renderIcon={Download}
        onClick={() => setSampleCodeTypeModalOpen(true)}
      >
        {'Sample code'}
      </Button>
    </div>
  )
}
