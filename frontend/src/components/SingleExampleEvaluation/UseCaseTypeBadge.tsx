import cx from 'classnames'

import { CSSProperties } from 'react'

import { Tag } from '@carbon/react'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'

import classes from './UseCaseTypeBadge.module.scss'
import { PipelineType } from './types'

interface Props {
  type: PipelineType
  style?: CSSProperties
  className?: string
}

export const UseCaseTypeBadge = ({ type: currentType, style, className }: Props) => {
  return (
    <div style={style} className={cx(className, classes['badge-padding'])}>
      {currentType === PipelineType.RUBRIC ? (
        <Tag className={classes['usecase-tag']} type="blue" size="lg">
          {RUBRIC_NAME}
        </Tag>
      ) : (
        <Tag className={classes['usecase-tag']} type="blue" size="lg">
          {PAIRWISE_NAME}
        </Tag>
      )}
    </div>
  )
}
