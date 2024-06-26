import Link from 'next/link'

import { Launch } from '@carbon/react/icons'

import { getQueryParamsFromUseCase, stringifyQueryParams } from '@utils/utils'

import { UseCase } from '../../../utils/types'
import classes from './UseCasePanel.module.scss'

interface LinkButtonProps {
  useCase: UseCase
}

export const LinkButton = ({ useCase }: LinkButtonProps) => {
  const urlParams = getQueryParamsFromUseCase(useCase)
  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={classes['link-button']}
      target="_blank"
      rel="noopener noreferrer"
      href={`/${stringifyQueryParams(urlParams)}`}
    >
      <Launch />
    </Link>
  )
}
