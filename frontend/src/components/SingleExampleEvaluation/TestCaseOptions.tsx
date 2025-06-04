import { toTitleCase } from 'src/utils'

import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton } from '@carbon/react'
import { Add, Download, Edit, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'

import { UseCaseTypeBadge } from '../UseCaseTypeBadge/UseCaseTypeBadge'
import classes from './TestCaseOptions.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
}

export const TestCaseOptions = ({ style, className }: Props) => {
  const [savingUseCase, setSavingUseCase] = useState(false)
  const { currentTestCase, isTestCaseSaved, changesDetected } = useCurrentTestCase()
  const { isRisksAndHarms } = useURLParamsContext()
  const { setDeleteUseCaseModalOpen, setSaveUseCaseModalOpen, setEditNameModalOpen, setSampleCodeTypeModalOpen } =
    useModalsContext()
  const { onSave } = useTestCaseActionsContext()
  const onSaveClick = async () => {
    setSavingUseCase(true)
    await onSave()
    setSavingUseCase(false)
  }

  return (
    <div
      style={{ ...style, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
      className={className}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
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
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {isTestCaseSaved && (
          <IconButton
            disabled={savingUseCase || !changesDetected || isRisksAndHarms}
            kind="ghost"
            onClick={onSaveClick}
            label={'Save'}
          >
            <Save />
          </IconButton>
        )}

        <IconButton
          disabled={isRisksAndHarms}
          label={'Save as'}
          kind="ghost"
          onClick={() => setSaveUseCaseModalOpen(true)}
        >
          <WatsonHealthSaveImage />
        </IconButton>
        <IconButton
          disabled={isRisksAndHarms}
          kind="ghost"
          label={'Sample code'}
          onClick={() => setSampleCodeTypeModalOpen(true)}
        >
          <Download />
        </IconButton>
        <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
        <IconButton
          kind="ghost"
          disabled={!isTestCaseSaved}
          label={'Delete Test Case'}
          onClick={() => {
            setDeleteUseCaseModalOpen(true)
          }}
        >
          <TrashCan />
        </IconButton>
      </div>
    </div>
  )
}
