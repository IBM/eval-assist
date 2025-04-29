import cx from 'classnames'
import { stringifyQueryParams } from 'src/utils'

import { useMemo } from 'react'

import Link from 'next/link'

import { Launch } from '@carbon/react/icons'

import { useGetQueryParamsFromUseCase } from '@customHooks/useGetQueryParamsFromUseCase'

import { UseCase } from '../../../types'
import sharedClasses from './shared.module.scss'

interface LinkButtonProps {
  useCase: UseCase
  subCatalogName?: string
  className?: string
}

export const LinkButton = ({ useCase, subCatalogName, className = '' }: LinkButtonProps) => {
  const { getQueryParamsFromUseCase } = useGetQueryParamsFromUseCase()

  const urlParams = useMemo(
    () => getQueryParamsFromUseCase(useCase, subCatalogName || null),
    [getQueryParamsFromUseCase, subCatalogName, useCase],
  )

  const queryParams = useMemo(() => stringifyQueryParams(urlParams), [urlParams])

  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={cx(sharedClasses.showOnHover, className)}
      target="_blank"
      rel="noopener noreferrer"
      href={`/${queryParams}`}
    >
      <Launch />
    </Link>
  )
}
