import { useMemo } from 'react'

import Link from 'next/link'

import { Launch } from '@carbon/react/icons'

import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'
import { stringifyQueryParams } from '@utils/utils'

import { UseCase } from '../../../types'
import classes from './LinkButton.module.scss'

interface LinkButtonProps {
  useCase: UseCase
  subCatalogName?: string
}

export const LinkButton = ({ useCase, subCatalogName }: LinkButtonProps) => {
  const { getQueryParamsFromUseCase } = useGetQueryParamsFromUseCase()

  const urlParams = useMemo(
    () => getQueryParamsFromUseCase(useCase, subCatalogName || null),
    [getQueryParamsFromUseCase, subCatalogName, useCase],
  )

  const queryParams = useMemo(() => stringifyQueryParams(urlParams), [urlParams])

  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={classes.linkButton}
      target="_blank"
      rel="noopener noreferrer"
      href={`/${queryParams}`}
    >
      <Launch />
    </Link>
  )
}
