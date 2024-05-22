import cx from 'classnames'

import { CSSProperties, Dispatch, SetStateAction } from 'react'

import Image from 'next/image'

import { Tile, useTheme } from '@carbon/react'
import { CheckmarkFilled } from '@carbon/react/icons'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { returnByPipelineType } from '@utils/utils'

import classes from './PipelineOptionCard.module.scss'
import { PipelineType } from './types'

interface PipelineOptionCardProps {
  type: PipelineType
  selectedType: PipelineType | null
  setSelectedType: Dispatch<SetStateAction<PipelineType | null>>
  style?: CSSProperties
  className?: string
}

export const PipelineOptionCard = ({
  type,
  selectedType,
  setSelectedType,
  style,
  className,
}: PipelineOptionCardProps) => {
  const onClick = () => {
    setSelectedType(type)
  }

  const { theme } = useTheme()

  return (
    <Tile
      style={{ ...style }}
      className={cx(className, classes['root'], {
        [classes.selected]: type === selectedType,
      })}
      onClick={onClick}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <h5 style={{ marginBottom: '0.5rem' }}>{returnByPipelineType(type, RUBRIC_NAME, PAIRWISE_NAME)}</h5>
        {type === selectedType && <CheckmarkFilled className={classes.check} />}
      </div>
      <p className={classes['description']}>
        {returnByPipelineType(
          type,
          'Select an answer based on the criteria for the question',
          'Choose the best response by comparing each pair',
        )}
      </p>
      {returnByPipelineType(
        type,
        <Image
          className={classes['card-image']}
          width={350}
          height={100}
          src={`/images/rubric_helper${theme !== 'white' ? '_dark' : ''}.svg`}
          alt={RUBRIC_NAME}
        />,
        <Image
          className={classes['card-image']}
          width={350}
          height={100}
          src={`/images/pairwise_helper${theme !== 'white' ? '_dark' : ''}.svg`}
          alt={PAIRWISE_NAME}
        />,
      )}
    </Tile>
  )
}
