import cx from 'classnames'

import { CSSProperties, useMemo } from 'react'

import Link from 'next/link'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tile } from '@carbon/react'

import { criteriaLibrary } from '@components/SingleExampleEvaluation/Libraries/CriteriaLibrary'
import { libraryUseCases } from '@components/SingleExampleEvaluation/Libraries/UseCaseLibrary'
import { CriteriaBenchmark, PairwiseCriteria, RubricCriteria, UseCase, Version } from '@utils/types'

import classes from './CriteriaBenchmarkCard.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  criteriaBenchmark: CriteriaBenchmark
  className?: string
  style?: CSSProperties
}

export const CriteriaBenchmarkCard = ({ criteriaBenchmark, className, style }: Props) => {
  const { benchmark } = useURLInfoContext()
  const criteria = useMemo(
    () => criteriaLibrary.find((c) => c.name === criteriaBenchmark.name) as RubricCriteria | PairwiseCriteria,
    [criteriaBenchmark.name],
  )

  const benchmarkMetrics = useMemo(() => {
    return Object.keys(criteriaBenchmark.evaluatorBenchmarks[0].results)
  }, [criteriaBenchmark.evaluatorBenchmarks])

  const metricToNumber = (metricValue: number | string) =>
    typeof metricValue === 'number' ? metricValue : +metricValue.replace(/\D/g, '')

  const smallerIsBetter = (metricName: string) => metricName === 'p_bias'

  const getBetterResult = (results: (number | string)[], metricName: string) => {
    const aggregationFunction = smallerIsBetter(metricName) ? Math.min : Math.max
    let betterResult: number | string = aggregationFunction(...results.map((r) => metricToNumber(r)))
    if (metricName === 'agreement') {
      betterResult = betterResult + '%'
    }
    console.log(betterResult)
    return betterResult
  }

  const newestEvaluators = useMemo(
    () =>
      criteriaBenchmark.evaluatorBenchmarks.filter((e) => {
        const repeatedEvaluators = criteriaBenchmark.evaluatorBenchmarks.filter(
          (ev) => ev.evaluator_id === e.evaluator_id,
        )

        repeatedEvaluators.sort((a, b) => {
          return new Version(a.laaj_version) > new Version(b.laaj_version) ? 1 : -1
        })

        return e.laaj_version === repeatedEvaluators[0].laaj_version
      }),
    [criteriaBenchmark.evaluatorBenchmarks],
  )

  const getLibraryTestCaseNameFromCriteriaName = (criteriaName: string) =>
    (libraryUseCases.find((l) => l.criteria.name === criteriaName) as UseCase).name

  return (
    <Tile className={cx(className, classes.root)} style={style}>
      <div className={classes.criteriaInfo}>
        <h5>{`Criteria: ${criteriaBenchmark.name}`}</h5>
        <Link
          href={`/?libraryTestCase=${getLibraryTestCaseNameFromCriteriaName(criteriaBenchmark.name)}&type=${
            benchmark?.type
          }`}
          style={{ textDecoration: 'none' }}
        >
          {'(See details)'}
        </Link>
      </div>
      <div className={cx(classes.table)}>
        <Table size="lg" useZebraStyles={false}>
          <TableHead>
            <TableRow>
              <TableHeader key={0}>Evaluator</TableHeader>
              {benchmarkMetrics.map((metric, i) => (
                <TableHeader key={i}>{metric}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {newestEvaluators.map((evaluatorBenchmark, i) => (
              <TableRow key={i}>
                <TableCell>{evaluatorBenchmark.evaluator_id}</TableCell>
                {benchmarkMetrics.map((metric) => (
                  <TableCell
                    key={metric}
                    className={cx({
                      [classes.highlightedCellText]:
                        evaluatorBenchmark.results[metric] ===
                        getBetterResult(
                          newestEvaluators.map((e) => e.results[metric]),
                          metric,
                        ),
                    })}
                  >
                    {evaluatorBenchmark.results[metric]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Tile>
  )
}
