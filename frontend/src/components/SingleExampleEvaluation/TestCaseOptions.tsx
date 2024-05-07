import { te } from 'date-fns/locale'

import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton, TextInput } from '@carbon/react'
import { Add, Edit, Save, WatsonHealthSaveImage } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

interface TestCaseOptionsProps {
  style?: CSSProperties
  className?: string
  setTestCaseName: Dispatch<SetStateAction<string>>
  testCaseName: string
  setSaveTestCaseModalOpen: Dispatch<SetStateAction<boolean>>
  isTestCaseSaved: boolean
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
}

export const TestCaseOptions = ({
  style,
  className,
  testCaseName,
  isTestCaseSaved,
  setSaveTestCaseModalOpen,
  onSave,
  setNewUseCaseModalOpen,
}: TestCaseOptionsProps) => {
  return (
    <div style={{ ...style, display: 'flex', flexDirection: 'row', alignItems: 'center' }} className={className}>
      <h4 style={{ paddingRight: '1rem' }}>{isTestCaseSaved ? testCaseName : 'Unsaved Use Case'}</h4>

      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>

      <Button disabled={!isTestCaseSaved} kind="ghost" renderIcon={Save} onClick={() => onSave()}>
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
    </div>
  )
}
