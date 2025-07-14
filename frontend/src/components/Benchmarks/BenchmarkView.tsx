import cx from 'classnames'

import { useMemo } from 'react'

import Link from 'next/link'

import { Breadcrumb, BreadcrumbItem, Button } from '@carbon/react'
import { Launch } from '@carbon/react/icons'

import { UseCaseTypeBadge } from '@components/UseCaseTypeBadge/UseCaseTypeBadge'
import { capitalizeFirstWord } from '@utils'

import { CriteriaBenchmarkCard } from './CriteriaBenchmarkCard'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const BenchmarkView = () => {
  const { benchmark, selectedCriteriaName } = useURLInfoContext()

  const benchmarkCriterias = useMemo(
    () =>
      (selectedCriteriaName === null
        ? benchmark?.criteriaBenchmarks
        : benchmark?.criteriaBenchmarks.filter(
            (criteriaBenchmark) => criteriaBenchmark.name === selectedCriteriaName,
          )) || [],
    [benchmark?.criteriaBenchmarks, selectedCriteriaName],
  )

  return (
    benchmark !== null && (
      <>
        <BenchmarkSidenav />
        <div className={cx(classes.root, classes.leftPadding)}>
          <Breadcrumb className={classes.breadcrumb}>
            <BreadcrumbItem isCurrentPage={false}>
              <Link href="/benchmarks">{'All benchmarks'}</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage={true}>
              <p>{benchmark.name}</p>
            </BreadcrumbItem>
          </Breadcrumb>
          <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>

          <div className={cx(classes.bottomDivider, classes.benchmarkHeader)}>
            <h4>{capitalizeFirstWord(benchmark.name)}</h4>

            <div className={classes['vertical-divider']}></div>
            <UseCaseTypeBadge type={benchmark.type} />
          </div>
          {/* <div className={classes.benchmarkContent}>
            <h4 className={classes.benchmarkDescriptionTitle}>Description</h4>
            <p className={classes.benchmarkDescription}>{benchmark.description}</p>
            <br></br>
          </div> */}
          <div
            className={cx(classes.criteriaBenchmark, {
              [classes.multipleRows]: benchmarkCriterias.length > 1,
            })}
          >
            {benchmarkCriterias.map((criteriaBenchmark, i) => (
              <CriteriaBenchmarkCard criteriaBenchmark={criteriaBenchmark} key={i} />
            ))}
          </div>
          <div>
            <Button
              href={benchmark.catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              kind={'ghost'}
              renderIcon={Launch}
            >
              {'Unitxt catalog'}
            </Button>
            {benchmark.readmeUrl && (
              <Button
                href={benchmark.readmeUrl}
                target="_blank"
                rel="noopener noreferrer"
                kind={'ghost'}
                renderIcon={Launch}
              >
                {'Dataset description'}
              </Button>
            )}
          </div>
        </div>
      </>
    )
  )
}
