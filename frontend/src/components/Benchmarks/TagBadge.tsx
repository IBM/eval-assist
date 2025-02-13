import cx from 'classnames'

import { CSSProperties } from 'react'

import { Tag } from '@carbon/react'

import { BadgeColor } from '../../types'
import classes from './TagBadge.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
  size?: 'sm' | 'md' | 'lg'
  name: string
  color: BadgeColor
  onClick?: (e: UIEvent) => void
}

export const TagBadge = ({ style, className, size, name, color, onClick }: Props) => {
  return (
    <Tag
      style={style}
      className={cx(className, classes['usecase-tag'])}
      type={color}
      size={size || 'md'}
      onClick={onClick}
    >
      {name}
    </Tag>
  )
}
