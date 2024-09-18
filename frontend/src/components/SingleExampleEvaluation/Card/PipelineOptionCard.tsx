import cx from 'classnames'
import { PAIRWISE_NAME, RUBRIC_NAME } from 'src/constants'

import { Dispatch, SetStateAction } from 'react'

import { returnByPipelineType } from '@utils/utils'

import { PipelineType } from '../../../types'
import { Card } from './Card'
import classes from './PipelineOptionCard.module.scss'

interface PipelineOptionCardProps {
  type: PipelineType
  selectedType: PipelineType | null
  setSelectedType: Dispatch<SetStateAction<PipelineType | null>>
}

export const PipelineOptionCard = ({ type, selectedType, setSelectedType }: PipelineOptionCardProps) => {
  const onClick = () => {
    setSelectedType(type)
  }

  return (
    <Card
      title={returnByPipelineType(type, RUBRIC_NAME, PAIRWISE_NAME)}
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
