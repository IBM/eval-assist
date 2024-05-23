import cx from 'classnames'

import { Dispatch, SetStateAction, useId, useState } from 'react'

import { IconButton } from '@carbon/react'
import { Categories, WatsonHealthSaveAnnotation } from '@carbon/react/icons'

import { UseCase } from '@components/SingleExampleEvaluation/types'

import layoutClasses from '../Layout.module.scss'
import classes from './AppSidenav.module.scss'
import { LibraryPanel } from './LibraryUseCasePanel'
import { UserUseCasePanel } from './UserUseCasePanel'

interface AppSidenavProps {
  setConfirmationModalOpen: Dispatch<SetStateAction<boolean>>
  setLibraryUseCaseSelected: Dispatch<SetStateAction<UseCase | null>>
  userUseCases: UseCase[]
  currentUseCaseId: number | null
  selected: 'user_use_cases' | 'library_use_cases' | null
  setSelected: Dispatch<SetStateAction<'user_use_cases' | 'library_use_cases' | null>>
  changesDetected: boolean
  setCurrentUseCase: (useCase: UseCase) => void
}

export const AppSidenavNew = ({
  setConfirmationModalOpen,
  setLibraryUseCaseSelected,
  userUseCases,
  currentUseCaseId,
  selected,
  setSelected,
  changesDetected,
  setCurrentUseCase,
}: AppSidenavProps) => {
  const id = useId()

  const onUseCaseClick = (useCase: UseCase) => {
    // if the usecase is already selected don't do nothing
    if (currentUseCaseId !== null && currentUseCaseId === useCase.id) return

    // if there are unsaved changes, let the user know that they may lose work
    if (changesDetected) {
      setConfirmationModalOpen(true)
      setLibraryUseCaseSelected(useCase)
    } else {
      // no unsaved changes, update the current use case without modals
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
            currentUseCaseId={currentUseCaseId}
          />
        )}
      </div>
    </aside>
  )
}
