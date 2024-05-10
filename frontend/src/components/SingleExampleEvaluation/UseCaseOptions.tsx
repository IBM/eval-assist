import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button } from '@carbon/react'
import { Add, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

interface UseCaseOptionsProps {
  style?: CSSProperties
  className?: string
  testCaseName: string
  isUseCaseSaved: boolean
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setDeleteUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setUseCaseName: Dispatch<SetStateAction<string>>
  useCaseName: string
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  changesDetected: boolean
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
}: UseCaseOptionsProps) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const onSaveClick = async () => {
    setSavingUseCase(true)
    await onSave()
    setSavingUseCase(false)
  }

  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'row', alignItems: 'center' }} className={className}>
      <h4 style={{ paddingRight: '1rem' }}>{isUseCaseSaved ? useCaseName : 'Unsaved Use Case'}</h4>

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
          setNewUseCaseModalOpen(true)
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
