import cx from 'classnames'
import { stringifyQueryParams } from 'src/utils'

import { useMemo } from 'react'

import Link from 'next/link'

import { Launch } from '@carbon/react/icons'

import { useGetQueryParamsFromTestCase } from '@customHooks/useGetQueryParamsFromTestCase'

import { TestCase } from '../../../types'
import sharedClasses from './shared.module.scss'

interface LinkButtonProps {
  testCase: TestCase
  subCatalogName?: string
  className?: string
}

export const LinkButton = ({ testCase, subCatalogName, className = '' }: LinkButtonProps) => {
  const { getQueryParamsFromTestCase } = useGetQueryParamsFromTestCase()

  const urlParams = useMemo(
    () => getQueryParamsFromTestCase(testCase, subCatalogName || null),
    [getQueryParamsFromTestCase, subCatalogName, testCase],
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
