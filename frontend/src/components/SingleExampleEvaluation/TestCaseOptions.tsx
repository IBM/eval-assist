import { toTitleCase } from 'src/utils'

import { CSSProperties, useState } from 'react'

import { Button, IconButton } from '@carbon/react'
import { Download, Edit, Save, TrashCan, WatsonHealthSaveImage } from '@carbon/react/icons'

import { TestCaseTypeBadge } from '@components/TestCaseTypeBadge/TestCaseTypeBadge'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useFeatureFlags } from '@providers/FeatureFlagsProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'

import classes from './TestCaseOptions.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
}

export const TestCaseOptions = ({ style, className }: Props) => {
  const [savingTestCase, setSavingTestCase] = useState(false)
  const { storageEnabled } = useFeatureFlags()
  const { currentTestCase, isTestCaseSaved, changesDetected } = useCurrentTestCase()
  const { isRisksAndHarms } = useURLParamsContext()
  const { setDeleteTestCaseModalOpen, setSaveTestCaseModalOpen, setEditNameModalOpen, setSampleCodeTypeModalOpen } =
    useModalsContext()
  const { onSave } = useTestCaseActionsContext()
  const onSaveClick = async () => {
    setSavingTestCase(true)
    await onSave()
    setSavingTestCase(false)
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
        <TestCaseTypeBadge type={currentTestCase.type} style={{ paddingInline: '0.5rem' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {storageEnabled && isTestCaseSaved && (
          <IconButton
            disabled={savingTestCase || !changesDetected || isRisksAndHarms}
            kind="ghost"
            onClick={onSaveClick}
            label={'Save'}
          >
            <Save />
          </IconButton>
        )}

        {storageEnabled && (
          <IconButton
            disabled={isRisksAndHarms}
            label={'Save as'}
            kind="ghost"
            onClick={() => setSaveTestCaseModalOpen(true)}
          >
            <WatsonHealthSaveImage />
          </IconButton>
        )}

        {storageEnabled ? (
          <IconButton
            disabled={isRisksAndHarms}
            kind="ghost"
            label={'Sample code'}
            onClick={() => setSampleCodeTypeModalOpen(true)}
          >
            <Download />
          </IconButton>
        ) : (
          <Button
            disabled={isRisksAndHarms}
            kind="ghost"
            renderIcon={Download}
            onClick={() => setSampleCodeTypeModalOpen(true)}
          >
            {'Donwload as code'}
          </Button>
        )}
        {storageEnabled && (
          <>
            <div style={{ height: '2rem' }} className={classes['vertical-divider']}></div>
            <IconButton
              kind="ghost"
              disabled={!isTestCaseSaved}
              label={'Delete Test Case'}
              onClick={() => {
                setDeleteTestCaseModalOpen(true)
              }}
            >
              <TrashCan />
            </IconButton>
          </>
        )}
      </div>
    </div>
  )
}
