import cx from 'classnames'

import { CSSProperties } from 'react'

import { Tag } from '@carbon/react'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'

import { PipelineType } from '../../utils/types'
import classes from './UseCaseTypeBadge.module.scss'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const UseCaseTypeBadge = ({ type: currentType, style, className, size }: Props) => {
  return (
    <div style={style} className={cx(className)}>
      <Tag className={classes['usecase-tag']} type="blue" size={size || 'md'}>
        {currentType === PipelineType.RUBRIC ? RUBRIC_NAME : PAIRWISE_NAME}
      </Tag>
    </div>
  )
}
