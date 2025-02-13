import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'
import { returnByPipelineType } from 'src/utils'

import { CSSProperties } from 'react'

import { Tag } from '@carbon/react'

import { EvaluationType } from '../../types'
import classes from './UseCaseTypeBadge.module.scss'

interface Props {
  type: EvaluationType
  style?: CSSProperties
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const UseCaseTypeBadge = ({ type: currentType, style, className, size }: Props) => {
  return (
    <div style={style} className={cx(className)}>
      <Tag className={classes['usecase-tag']} type="blue" size={size || 'md'}>
        {returnByPipelineType(currentType, DIRECT_NAME, PAIRWISE_NAME)}
      </Tag>
    </div>
  )
}
