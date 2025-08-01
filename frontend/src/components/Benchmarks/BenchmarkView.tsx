import cx from 'classnames'

import { useMemo, useState } from 'react'

import Link from 'next/link'

import { Breadcrumb, BreadcrumbItem, Button, Toggle } from '@carbon/react'
import { Launch } from '@carbon/react/icons'

import { TestCaseTypeBadge } from '@components/TestCaseTypeBadge/TestCaseTypeBadge'
import { splitDotsAndCapitalizeFirstWord } from '@utils'

import { CriteriaBenchmarkCard } from './CriteriaBenchmarkCard'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const BenchmarkView = () => {
  const { benchmark, selectedCriteriaName } = useURLInfoContext()
  const [showCorrelationColumns, setShowCorrelationColumns] = useState(false)

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
            <div className={classes.benchmarkTile}>
              <h4>{splitDotsAndCapitalizeFirstWord(benchmark.name)}</h4>

              <div className={classes['vertical-divider']}></div>
              <TestCaseTypeBadge type={benchmark.type} />
            </div>

            <Toggle
              labelText={'Show correlation columns'}
              toggled={showCorrelationColumns}
              onToggle={() => setShowCorrelationColumns((prev) => !prev)}
              size="sm"
              hideLabel
              id={`toggle-expected-result`}
              className={classes.toggle}
            />
          </div>
          {/* <div className={classes.benchmarkContent}>
            <h4 className={classes.benchmarkDescriptionTitle}>Description</h4>
            <p className={classes.benchmarkDescription}>{benchmark.description}</p>
            <br></br>
          </div> */}
          <div
            className={cx(classes.criteriaBenchmark, {
              [classes.multipleColumns]: benchmarkCriterias.length > 1 && !showCorrelationColumns,
            })}
          >
            {benchmarkCriterias.map((criteriaBenchmark, i) => (
              <CriteriaBenchmarkCard
                criteriaBenchmark={criteriaBenchmark}
                key={i}
                showCorrelationColumns={showCorrelationColumns}
              />
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
            {benchmark.url && (
              <Button href={benchmark.url} target="_blank" rel="noopener noreferrer" kind={'ghost'} renderIcon={Launch}>
                {'Dataset description'}
              </Button>
            )}
          </div>
        </div>
      </>
    )
  )
}
