import cx from 'classnames'

import { CSSProperties } from 'react'

import Image from 'next/image'

import { Tag, Tile } from '@carbon/react'
import { CheckmarkFilled } from '@carbon/react/icons'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'

import classes from './Card.module.scss'

interface PipelineOptionCardProps {
  title: string
  description: string
  imageSrc: string
  style?: CSSProperties
  className?: string
  actionButton?: JSX.Element
  isSelected?: boolean
  onClick?: () => void
  badge?: {
    text: string
    // copied from carbon types
    color:
      | 'blue'
      | 'cyan'
      | 'gray'
      | 'green'
      | 'magenta'
      | 'purple'
      | 'red'
      | 'teal'
      | 'cool-gray'
      | 'warm-gray'
      | 'high-contrast'
      | 'outline'
      | undefined
  }
  isImagePriority?: boolean
}

export const Card = ({
  style,
  className,
  title,
  description,
  imageSrc,
  actionButton,
  isSelected = false,
  badge,
  onClick,
  isImagePriority = false,
}: PipelineOptionCardProps) => {
  const { isDarkMode } = useThemeContext()
  return (
    <Tile style={{ ...style }} className={cx(className, classes.root)} onClick={onClick}>
      <div className={classes['title-row']}>
        <h5 className={classes.title}>{title}</h5>
        {isSelected && <CheckmarkFilled className={classes.check} />}
      </div>
      {badge && (
        <Tag className={classes.badge} type={badge.color} size="md">
          {badge.text}
        </Tag>
      )}
      <p className={classes['description']}>{description}</p>
      <Image
        className={cx(classes['card-image'], { [classes['card-image-margin']]: actionButton })}
        width={250}
        height={125}
        src={`images/${isDarkMode() ? 'dark_mode_' : ''}${imageSrc}.svg`}
        alt={title}
        priority={isImagePriority}
      />
      {actionButton && <div className={classes['action-button']}>{actionButton}</div>}
    </Tile>
  )
}
