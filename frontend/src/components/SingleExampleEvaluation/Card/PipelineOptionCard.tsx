import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'
import { returnByPipelineType } from 'src/utils'

import { EvaluationType } from '../../../types'
import { Card } from './Card'
import classes from './PipelineOptionCard.module.scss'

interface PipelineOptionCardProps {
  type: EvaluationType
  selectedType: EvaluationType | null
  onClick?: () => void
}

export const PipelineOptionCard = ({ type, selectedType, onClick }: PipelineOptionCardProps) => {
  return (
    <Card
      title={returnByPipelineType(type, DIRECT_NAME, PAIRWISE_NAME)}
      description={returnByPipelineType(
        type,
        'Select an answer based on the criteria for the question',
        'Choose the best response by comparing each pair',
      )}
      isSelected={type === selectedType}
      imageSrc={returnByPipelineType(type, 'rubric_helper', 'pairwise_helper')}
      onClick={onClick}
      className={cx(classes.root, {
        [classes.selected]: type === selectedType,
      })}
    />
  )
}
