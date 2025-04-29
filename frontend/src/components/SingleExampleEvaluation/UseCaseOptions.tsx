import { toTitleCase } from 'src/utils'

import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton } from '@carbon/react'
import { Add, Download, Edit, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'

import { UseCaseTypeBadge } from '../UseCaseTypeBadge/UseCaseTypeBadge'
import { useCurrentTestCase } from './Providers/CurrentTestCaseProvider'
import { useURLParamsContext } from './Providers/URLParamsProvider'
import classes from './UseCaseOptions.module.scss'

interface UseCaseOptionsProps {
  style?: CSSProperties
  className?: string
  onSave: () => Promise<void>
  setNewUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setDeleteUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setEditNameModalOpen: Dispatch<SetStateAction<boolean>>
  setSaveUseCaseModalOpen: Dispatch<SetStateAction<boolean>>
  setSampleCodeTypeModalOpen: Dispatch<SetStateAction<boolean>>
}

export const UseCaseOptions = ({
  style,
  className,
  setSaveUseCaseModalOpen,
  onSave,
  setNewUseCaseModalOpen,
  setDeleteUseCaseModalOpen,
  setEditNameModalOpen,
  setSampleCodeTypeModalOpen,
}: UseCaseOptionsProps) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const { currentTestCase, isTestCaseSaved, changesDetected } = useCurrentTestCase()
  const { isRisksAndHarms } = useURLParamsContext()
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
          opacity: currentTestCase.name ? 'inherit' : '0.5',
        }}
      >
        {toTitleCase(currentTestCase.name) || 'Unsaved test case'}
      </h4>
      {isTestCaseSaved && (
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
      <UseCaseTypeBadge type={currentTestCase.type} style={{ paddingInline: '0.5rem' }} />
      <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
      {isTestCaseSaved ? (
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
        disabled={!isTestCaseSaved}
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
