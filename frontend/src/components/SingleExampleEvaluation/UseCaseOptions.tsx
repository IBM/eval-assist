import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton } from '@carbon/react'
import { Add, Edit, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'

import { getEmptyUseCase } from '@utils/utils'

import classes from './SingleExampleEvaluation.module.scss'
import { UseCase } from './types'

interface UseCaseOptionsProps {
  style?: CSSProperties
  className?: string
  testCaseName: string
  isUseCaseSaved: boolean
  useCaseName: string
  changesDetected: boolean
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setDeleteUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setUseCaseName: Dispatch<SetStateAction<string>>
  setEditNameModalOpen: Dispatch<SetStateAction<boolean>>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setCurrentUseCase: (useCase: UseCase) => void
}

export const UseCaseOptions = ({
  style,
  className,
  useCaseName,
  isUseCaseSaved,
  setSaveUseCaseModalOpen,
  onSave,
  setNewUseCaseModalOpen,
  changesDetected,
  setDeleteUseCaseModalOpen,
  setEditNameModalOpen,
  setCurrentUseCase,
}: UseCaseOptionsProps) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const onSaveClick = async () => {
    setSavingUseCase(true)
    await onSave()
    setSavingUseCase(false)
  }
  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'row', alignItems: 'center' }} className={className}>
      <h4 style={{ paddingRight: '0.5rem' }}>{isUseCaseSaved ? useCaseName : 'Unsaved Use Case'}</h4>
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

      <Button
        disabled={savingUseCase || !isUseCaseSaved || !changesDetected}
        kind="ghost"
        renderIcon={Save}
        onClick={onSaveClick}
      >
        {'Save'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button kind="ghost" renderIcon={WatsonHealthSaveImage} onClick={() => setSaveUseCaseModalOpen(true)}>
        {'Save as'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button
        kind="ghost"
        renderIcon={Add}
        onClick={() => {
          if (changesDetected) {
            setNewUseCaseModalOpen(true)
          } else {
            setCurrentUseCase(getEmptyUseCase())
          }
        }}
      >
        {'New Use Case'}
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
        {'Delete Use Case'}
      </Button>
    </div>
  )
}
