import cx from 'classnames'

import { Dispatch, SetStateAction, useId, useState } from 'react'

import { IconButton } from '@carbon/react'
import { Categories, WatsonHealthSaveAnnotation } from '@carbon/react/icons'

import { UseCase } from '@utils/types'

import layoutClasses from '../Layout.module.scss'
import { useAppSidebarContext } from '../Providers/AppSidebarProvider'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import classes from './AppSidenav.module.scss'
import { LibraryPanel } from './LibraryUseCasePanel'
import { UserUseCasePanel } from './UserUseCasePanel'

interface AppSidenavProps {
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
  userUseCases: UseCase[]
  changesDetected: boolean
  setCurrentUseCase: (useCase: UseCase) => void
  setEvaluationRunningModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
}

export const AppSidenavNew = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  userUseCases,
  changesDetected,
  setCurrentUseCase,
  setEvaluationRunningModalOpen,
  evaluationRunning,
}: AppSidenavProps) => {
  const id = useId()
  const { sidebarTabSelected: selected, setSidebarTabSelected: setSelected } = useAppSidebarContext()
  const { useCaseId } = useURLInfoContext()

  const onUseCaseClick = (useCase: UseCase) => {
    // if the usecase is already selected don't do nothing
    if (useCaseId !== null && useCaseId === useCase.id) return
    // if there are unsaved changes, let the user know that they may lose work
    if (changesDetected) {
      setLibraryUseCaseSelected(useCase)
      setConfirmationModalOpen(true)
    } else if (evaluationRunning) {
      setLibraryUseCaseSelected(useCase)
      setEvaluationRunningModalOpen(true)
    } else {
      // no unsaved changes and model is not running update the current use case without modals
      setCurrentUseCase(useCase)
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
            label="Example Catalog"
            kind="ghost"
            size="lg"
            className={cx(classes.itemBtn, {
              [classes.selected]: selected === 'library_use_cases',
            })}
            id={`${id}-tab__library_use_cases`}
            role="tab"
            aria-selected={selected === 'library_use_cases'}
            aria-controls={`${id}-tabpanel__library_use_cases`}
            onClick={() => {
              setSelected((selected) => (selected === 'library_use_cases' ? null : 'library_use_cases'))
            }}
          >
            <Categories size={20} />
          </IconButton>
        </li>
        <li>
          <IconButton
            align="right"
            label="My Test Cases"
            kind="ghost"
            size="lg"
            className={cx(classes.itemBtn, {
              [classes.selected]: selected === 'user_use_cases',
            })}
            id={`${id}-tab__user_use_cases`}
            role="tab"
            aria-selected={selected === 'user_use_cases'}
            aria-controls={`${id}-tabpanel__user_use_cases`}
            onClick={() => {
              setSelected((selected) => (selected === 'user_use_cases' ? null : 'user_use_cases'))
            }}
          >
            <WatsonHealthSaveAnnotation size={20} />
          </IconButton>
        </li>
      </ul>
      <div
        role="tabpanel"
        className={classes.panel}
        id={`${id}-tabpanel__library_use_cases`}
        hidden={selected !== 'library_use_cases'}
        tabIndex={-1}
      >
        {selected === 'library_use_cases' && (
          <LibraryPanel
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
        id={`${id}-tabpanel__user_use_cases`}
        hidden={selected !== 'user_use_cases'}
        tabIndex={-1}
      >
        {selected === 'user_use_cases' && (
          <UserUseCasePanel
            onUseCaseClick={onUseCaseClick}
            onClose={() => {
              setSelected(null)
            }}
            userUseCases={userUseCases}
          />
        )}
      </div>
    </aside>
  )
}
