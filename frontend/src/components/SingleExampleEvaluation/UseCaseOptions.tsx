import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { Button } from '@carbon/react'
import { Add, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

interface TestCaseOptionsProps {
  style?: CSSProperties
  className?: string
  setTestCaseName: Dispatch<SetStateAction<string>>
  testCaseName: string
  setSaveTestCaseModalOpen: Dispatch<SetStateAction<boolean>>
  isUseCaseSaved: boolean
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setDeleteUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
}

export const TestCaseOptions = ({
  style,
  className,
  testCaseName,
  isUseCaseSaved,
  setSaveTestCaseModalOpen,
  onSave,
  setNewUseCaseModalOpen,
  setDeleteUseCaseModalOpen,
}: TestCaseOptionsProps) => {
  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'row', alignItems: 'center' }} className={className}>
      <h4 style={{ paddingRight: '1rem' }}>{isUseCaseSaved ? testCaseName : 'Unsaved Use Case'}</h4>

      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>

      <Button disabled={!isUseCaseSaved} kind="ghost" renderIcon={Save} onClick={() => onSave()}>
        {'Save'}
      </Button>
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      <Button kind="ghost" renderIcon={WatsonHealthSaveImage} onClick={() => setSaveTestCaseModalOpen(true)}>
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
