import cx from 'classnames'

import { CSSProperties } from 'react'

import { Tag } from '@carbon/react'

import { BadgeColor, PipelineType } from '../../utils/types'
import classes from './TagBadge.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
  size?: 'sm' | 'md' | 'lg'
  name: string
  color: BadgeColor
}

export const TagBadge = ({ style, className, size, name, color }: Props) => {
  return (
    <div style={style} className={cx(className)}>
      <Tag className={classes['usecase-tag']} type={color} size={size || 'md'}>
        {name}
      </Tag>
    </div>
  )
}
