import cx from 'classnames'

import { useMemo } from 'react'

import { UseCaseTypeBadge } from '@components/SingleExampleEvaluation/UseCaseTypeBadge'

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
          <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>

          <div className={cx(classes.bottomDivider, classes.benchmarkInfo)}>
            <h4>{benchmark.name}</h4>

            <div className={classes['vertical-divider']}></div>
            <UseCaseTypeBadge type={benchmark.type} />
          </div>
          <div>
            <h4 className={classes.benchmarkDescriptionTitle}>Description</h4>
            <p>{benchmark.description}</p>
          </div>
          <div
            className={cx(classes.criteriaBenchmark, {
              [classes.multipleRows]: benchmarkCriterias.length > 1,
            })}
          >
            {benchmarkCriterias.map((criteriaBenchmark, i) => (
              <CriteriaBenchmarkCard criteriaBenchmark={criteriaBenchmark} key={i} />
            ))}
          </div>
        </div>
      </>
    )
  )
}
