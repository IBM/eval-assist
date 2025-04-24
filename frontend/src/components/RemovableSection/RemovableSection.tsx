import cx from 'classnames'

import { useState } from 'react'

import { Tooltip } from '@carbon/react'
import { Maximize, Play, Replicate, TrashCan } from '@carbon/react/icons'

import classes from './RemovableSection.module.scss'

interface Props {
  onRemove: () => void
  onExpand: () => void
  onDuplicate: () => void
  onEvaluateInstance: () => void
  removeEnabled?: boolean
  children: (arg: { setActive: () => void; setInactive: () => void }) => JSX.Element
}

export default function RemovableSection({
  onRemove,
  onExpand,
  onDuplicate,
  onEvaluateInstance,
  removeEnabled,
  children,
}: Props) {
  const [active, setActive] = useState(false)

  return (
    <div className={cx(classes.container)}>
      <div className={classes.outline} />
      {children({
        setActive: () => setActive(true),
        setInactive: () => setActive(false),
      })}

      <div className={cx(classes.actionButtonsContainer)}>
        <Tooltip label="Duplicate" align="top">
          <button
            aria-label="Duplicate"
            className={cx(classes.actionButton, {
              [classes.active]: active,
            })}
            onClick={onDuplicate}
            tabIndex={-1}
          >
            <Replicate />
          </button>
        </Tooltip>
        <Tooltip label="Evaluate" align="left">
          <button
            aria-label="Evaluate"
            className={cx(classes.actionButton, {
              [classes.active]: active,
            })}
            onClick={onEvaluateInstance}
            tabIndex={-1}
          >
            <Play />
          </button>
        </Tooltip>
        <Tooltip label="See details" align="left">
          <button
            aria-label="See details"
            className={cx(classes.actionButton, {
              [classes.active]: active,
            })}
            onClick={onExpand}
            tabIndex={-1}
          >
            <Maximize />
          </button>
        </Tooltip>
        {removeEnabled && (
          <Tooltip label="Remove" align="bottom">
            <button
              aria-label="Remove"
              className={cx(classes.actionButton, {
                [classes.active]: active,
              })}
              onClick={onRemove}
              tabIndex={-1}
            >
              <TrashCan />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
