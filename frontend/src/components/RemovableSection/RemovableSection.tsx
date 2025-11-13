import cx from 'classnames'

import { useState } from 'react'

import { Tooltip } from '@carbon/react'
import { CarbonIconType } from '@carbon/react/icons'

import { useAppSidebarContext } from '@providers/AppSidebarProvider'

import classes from './RemovableSection.module.scss'

interface Action {
  label: string
  fn: () => void
  enabled: boolean
  icon: CarbonIconType
}

interface Props {
  actions: Action[]
  children: (arg: { setActive: () => void; setInactive: () => void }) => JSX.Element
}

export default function RemovableSection({ actions, children }: Props) {
  const [active, setActive] = useState(false)
  const { sidebarTabSelected } = useAppSidebarContext()
  return (
    <div className={cx(classes.container)}>
      <div className={classes.outline} />
      {children({
        setActive: () => setActive(true),
        setInactive: () => setActive(false),
      })}

      <div
        className={cx(classes.actionButtonsContainer)}
        style={{ gap: actions.length > 2 ? `${125 / actions.length - 20}px` : '10px' }}
      >
        {actions.map((action, i) => (
          <Tooltip
            label={action.label}
            align={i == 0 ? 'top' : i == actions.length - 1 ? 'bottom' : sidebarTabSelected ? 'left' : 'right'}
            key={i}
          >
            <button
              aria-label={action.label}
              className={cx(classes.actionButton, {
                [classes.active]: active,
              })}
              onClick={action.fn}
              tabIndex={-1}
            >
              {<action.icon />}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
