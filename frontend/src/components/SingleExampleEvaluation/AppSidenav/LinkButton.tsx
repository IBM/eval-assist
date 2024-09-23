import Link from 'next/link'

import { Launch } from '@carbon/react/icons'

import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'
import { stringifyQueryParams } from '@utils/utils'

import { UseCase } from '../../../types'
import classes from './LinkButton.module.scss'

interface LinkButtonProps {
  useCase: UseCase
}

export const LinkButton = ({ useCase }: LinkButtonProps) => {
  const { getQueryParamsFromUseCase } = useGetQueryParamsFromUseCase()
  const urlParams = getQueryParamsFromUseCase(useCase)
  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={classes.linkButton}
      target="_blank"
      rel="noopener noreferrer"
      href={`/${stringifyQueryParams(urlParams)}`}
    >
      <Launch />
    </Link>
  )
}
