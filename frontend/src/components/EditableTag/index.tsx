import cx from 'classnames'

import { CSSProperties, ChangeEvent, useRef, useState } from 'react'

import { IconButton, Tag, TextInput } from '@carbon/react'
import { Edit, Save } from '@carbon/react/icons'

import { BadgeColor } from '@types'

import classes from './index.module.scss'

interface Props {
  value: string
  onChange: ((event: ChangeEvent<HTMLInputElement>) => void) | undefined
  setActive?: () => void
  setInactive?: () => void
  i?: number
  style?: CSSProperties
  className?: string
  color: BadgeColor
  isEditable?: boolean
  onEdit?: () => void
}

export const EditableTag = ({
  value,
  onChange,
  setActive,
  setInactive,
  i,
  color,
  className,
  isEditable = true,
  onEdit,
}: Props) => {
  const [isEditing, setIsEditing] = useState(value === '')
  const inputRef = useRef(null)

  const _handleBlur = () => {
    if (value !== '') setIsEditing(false)
    setInactive && setInactive()
  }

  return (
    <div className={cx(className)}>
      <div className={cx(classes.container)}>
        {isEditing ? (
          <>
            <TextInput
              ref={inputRef}
              onChange={onChange}
              value={value}
              id="text-input-variable-name"
              key={`${i}_1`}
              onFocus={setActive}
              onBlur={_handleBlur}
              className={cx(classes.variableNameInput)}
              labelText={''}
              placeholder="Variable name"
              autoFocus
              onKeyUp={(event: React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key == 'Enter') {
                  setIsEditing(false)
                }
              }}
            />
            {value !== '' && (
              <IconButton kind={'ghost'} label={'Save'} onClick={() => setIsEditing(false)}>
                <Save />
              </IconButton>
            )}
          </>
        ) : (
          <>
            <Tag type={color} size={'sm'} className={cx(classes.tag)}>
              {value}
            </Tag>
            {isEditable && (
              <IconButton kind={'ghost'} label={'Edit'} onClick={() => (onEdit ? onEdit() : setIsEditing(true))}>
                <Edit />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  )
}
