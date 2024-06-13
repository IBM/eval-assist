import cx from 'classnames'

import { useState } from 'react'

import { CloseFilled } from '@carbon/react/icons'

import classes from './RemovableSection.module.scss'

interface Props {
  onRemove: () => void
  readOnly?: boolean
  children: (arg: { setActive: () => void; setInactive: () => void }) => JSX.Element
}

export default function RemovableSection({ onRemove, readOnly, children }: Props) {
  const [active, setActive] = useState(false)

  return (
    <div
      className={cx(classes.container, {
        [classes.active]: !active,
      })}
    >
      <div className={classes.outline} />
      {children({
        setActive: () => setActive(true),
        setInactive: () => setActive(false),
      })}

      {!readOnly && (
        <button
          aria-label="Remove"
          className={cx(classes.removeBtn, {
            [classes.active]: active,
          })}
          onClick={onRemove}
        >
          <CloseFilled />
        </button>
      )}
    </div>
  )
}
