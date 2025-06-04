import cx from 'classnames'

import { useId } from 'react'

import { IconButton } from '@carbon/react'
import { Categories, IbmSecurity, WatsonHealthSaveAnnotation } from '@carbon/react/icons'

import { useAppSidebarContext } from '@providers/AppSidebarProvider'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'
import { useUserUseCasesContext } from '@providers/UserUseCasesProvider'
import { TestCase } from '@types'

import layoutClasses from '../Layout.module.scss'
import classes from './AppSidenav.module.scss'
import { ExampleCatalogPanel } from './ExampleCatalogPanel'
import { RiskAndHarmPanel } from './RiskAndHarmPanel'
import { SavedTestCasesPanel } from './SavedTestCasesPanel'

interface AppSidenavProps {}

export const AppSidenavNew = ({}: AppSidenavProps) => {
  const id = useId()
  const { sidebarTabSelected: selected, setSidebarTabSelected: setSelected } = useAppSidebarContext()
  const { setConfirmationModalOpen, setEvaluationRunningModalOpen } = useModalsContext()
  const { useCaseId } = useURLParamsContext()
  const { changesDetected, setTestCaseSelected, updateURLFromTestCase } = useCurrentTestCase()
  const { evaluationRunning } = useTestCaseActionsContext()
  const { userUseCases } = useUserUseCasesContext()
  const onUseCaseClick = (useCase: TestCase, subCatalogName?: string) => {
    // if the usecase is already selected don't do nothing
    if (useCaseId !== null && useCaseId === useCase.id) return
    // if there are unsaved changes, let the user know that they may lose work
    if (changesDetected) {
      setTestCaseSelected({ useCase, subCatalogName: subCatalogName || null })
      setConfirmationModalOpen(true)
    } else if (evaluationRunning) {
      setTestCaseSelected({ useCase, subCatalogName: subCatalogName || null })
      setEvaluationRunningModalOpen(true)
    } else {
      // no unsaved changes and model is not running update the current test case without modals
      updateURLFromTestCase({ useCase, subCatalogName: subCatalogName || null })
    }
  }

  return (
    <aside
      className={cx(classes.root, layoutClasses.sidebar, {
        [layoutClasses.expanded]: selected != null,
      })}
    >
      <ul className={classes.items} role="tablist" aria-orientation="vertical">
        <li>
          <IconButton
            align="right"
            label="Example Catalog - General"
            kind="ghost"
            size="lg"
            className={cx(classes.itemBtn, {
              [classes.selected]: selected === 'library_test_cases',
            })}
            id={`${id}-tab__library_test_cases`}
            role="tab"
            aria-selected={selected === 'library_test_cases'}
            aria-controls={`${id}-tabpanel__library_test_cases`}
            onClick={() => {
              setSelected((selected) => (selected === 'library_test_cases' ? null : 'library_test_cases'))
            }}
          >
            <Categories size={20} />
          </IconButton>
        </li>
        <li>
          <IconButton
            align="right"
            label="Example Catalog - Harms & Risks"
            kind="ghost"
            size="lg"
            className={cx(classes.itemBtn, {
              [classes.selected]: selected === 'risks_and_harms',
            })}
            id={`${id}-tab__risks_and_harms`}
            role="tab"
            aria-selected={selected === 'risks_and_harms'}
            aria-controls={`${id}-tabpanel_risks_and_harms`}
            onClick={() => {
              setSelected((selected) => (selected === 'risks_and_harms' ? null : 'risks_and_harms'))
            }}
          >
            <IbmSecurity size={20} />
          </IconButton>
        </li>
        <li>
          <IconButton
            align="right"
            label="My Test Cases"
            kind="ghost"
            size="lg"
            className={cx(classes.itemBtn, {
              [classes.selected]: selected === 'user_test_cases',
            })}
            id={`${id}-tab__user_test_cases`}
            role="tab"
            aria-selected={selected === 'user_test_cases'}
            aria-controls={`${id}-tabpanel__user_test_cases`}
            onClick={() => {
              setSelected((selected) => (selected === 'user_test_cases' ? null : 'user_test_cases'))
            }}
          >
            <WatsonHealthSaveAnnotation size={20} />
          </IconButton>
        </li>
      </ul>
      <div
        role="tabpanel"
        className={classes.panel}
        id={`${id}-tabpanel__example_catalog`}
        hidden={selected !== 'library_test_cases'}
        tabIndex={-1}
      >
        {selected === 'library_test_cases' && (
          <ExampleCatalogPanel
            onUseCaseClick={onUseCaseClick}
            onClose={() => {
              setSelected(null)
            }}
          />
        )}
      </div>
      <div
        role="tabpanel"
        className={classes.panel}
        id={`${id}-tabpanel__user_test_cases`}
        hidden={selected !== 'user_test_cases'}
        tabIndex={-1}
      >
        {selected === 'user_test_cases' && (
          <SavedTestCasesPanel
            onUseCaseClick={onUseCaseClick}
            onClose={() => {
              setSelected(null)
            }}
            userUseCases={userUseCases}
          />
        )}
      </div>
      <div
        role="tabpanel"
        className={classes.panel}
        id={`${id}-tabpanel__risks_and_harms`}
        hidden={selected !== 'risks_and_harms'}
        tabIndex={-1}
      >
        {selected === 'risks_and_harms' && (
          <RiskAndHarmPanel
            onUseCaseClick={onUseCaseClick}
            onClose={() => {
              setSelected(null)
            }}
          />
        )}
      </div>
    </aside>
  )
}
