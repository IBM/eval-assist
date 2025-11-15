import cx from 'classnames'
import { returnByPipelineType } from 'src/utils'
import { v4 as uuid } from 'uuid'

import { useMemo, useRef } from 'react'

import { Button, Link } from '@carbon/react'
import { Add, Password, Upload, WarningFilled } from '@carbon/react/icons'

import { useBeforeOnload } from '@customHooks/useBeforeOnload'
import { useShortcuts } from '@customHooks/useShortcuts'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { useFeatureFlags } from '@providers/FeatureFlagsProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'

import { Evaluator } from '../../types'
import { AppSidenavNew } from './AppSidenav'
import { ConnectionTest } from './ConnectionTest'
import { CriteriaView } from './CriteriaView'
import { EvaluateButton } from './EvaluateButton'
import { PipelineSelect } from './EvaluatorSelect'
import { InContextExampleTableTable } from './InContextExamplesTable'
import { Landing } from './Landing'
import layoutClasses from './Layout.module.scss'
import { Modals } from './Modals'
import classes from './SingleExampleEvaluation.module.scss'
import { TestCaseOptions } from './TestCaseOptions'
import { TestDataTable } from './TestDataTable'

export const SingleExampleEvaluation = () => {
  const {
    currentTestCase,
    setCurrentTestCase,
    changesDetected,
    isTestCaseSaved,
    showingTestCase,
    areRelevantCredentialsProvided,
  } = useCurrentTestCase()

  const {
    setNewTestCaseModalOpen,
    setImportTestCaseModalOpen: setUploadTestCaseModalOpen,
    setmodelProviderCrendentialsModalOpen,
  } = useModalsContext()

  const { isRisksAndHarms } = useURLParamsContext()

  const { nonGraniteGuardianDirectEvaluators, nonGraniteGuardianPairwiseEvaluators, graniteGuardianEvaluators } =
    useEvaluatorOptionsContext()

  const evaluatorOptions = useMemo(
    () =>
      isRisksAndHarms
        ? graniteGuardianEvaluators || []
        : returnByPipelineType(
            currentTestCase.type,
            nonGraniteGuardianDirectEvaluators,
            nonGraniteGuardianPairwiseEvaluators,
          ) || [],
    [
      currentTestCase.type,
      graniteGuardianEvaluators,
      isRisksAndHarms,
      nonGraniteGuardianDirectEvaluators,
      nonGraniteGuardianPairwiseEvaluators,
    ],
  )

  useBeforeOnload(changesDetected)
  const temporaryIdRef = useRef(uuid())
  const { onSave } = useTestCaseActionsContext()
  const { storageEnabled } = useFeatureFlags()

  useShortcuts({ onSave, changesDetected, isTestCaseSaved })

  return (
    <>
      <AppSidenavNew />
      <div className={cx(layoutClasses['main-content'], classes.body)}>
        {!showingTestCase ? (
          <Landing />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                marginBottom: '1rem',
              }}
              className={cx(classes['bottom-divider'], classes['left-padding'])}
            >
              <h3>Evaluation sandbox</h3>
              <div>
                <Button
                  style={{ marginRight: '0.25rem' }}
                  kind="tertiary"
                  onClick={() => {
                    setNewTestCaseModalOpen(true)
                  }}
                  renderIcon={Add}
                >
                  {'New Test Case'}
                </Button>
                {storageEnabled && (
                  <Button
                    kind="tertiary"
                    onClick={() => {
                      setUploadTestCaseModalOpen(true)
                    }}
                    renderIcon={Upload}
                  >
                    {'Import Test Case'}
                  </Button>
                )}
              </div>
            </div>
            <TestCaseOptions style={{ marginBottom: '1rem' }} className={classes['left-padding']} />
            <CriteriaView
              criteria={currentTestCase.criteria}
              setCriteria={(criteria) => setCurrentTestCase({ ...currentTestCase, criteria })}
              type={currentTestCase.type}
              temporaryId={temporaryIdRef.current}
              style={{ marginBottom: '1rem' }}
              className={classes['left-padding']}
            />

            {currentTestCase.examples.length > 0 && (
              <>
                <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
                  <strong>Examples</strong>
                </div>
                <InContextExampleTableTable style={{ marginBottom: '1rem' }} className={classes['left-padding']} />
              </>
            )}
            <div style={{ marginBottom: '1rem' }} className={classes['left-padding']}>
              <strong>Test data</strong>
            </div>
            <TestDataTable style={{ marginBottom: '1rem' }} className={classes['left-padding']} />
            <EvaluateButton className={classes['left-padding']} />
          </>
        )}
      </div>
      <Modals />
    </>
  )
}
