import cx from 'classnames'

import { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Link, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tile } from '@carbon/react'

import { CriteriaBenchmark, EvaluatorBenchmark, PipelineType, Version } from '@utils/types'
import { getCriteria } from '@utils/utils'

import classes from './CriteriaBenchmarkCard.module.scss'
import { CriteriaDetailsModal } from './CriteriaDetailsModal'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  criteriaBenchmark: CriteriaBenchmark
  className?: string
  style?: CSSProperties
}

export const CriteriaBenchmarkCard = ({ criteriaBenchmark, className, style }: Props) => {
  const { benchmark } = useURLInfoContext()
  const [criteriaDetailsModal, setCriteriaDetailsModal] = useState(false)

  const criteria = useMemo(
    () => getCriteria(criteriaBenchmark.name, benchmark?.type as PipelineType),
    [benchmark?.type, criteriaBenchmark.name],
  )

  const benchmarkMetrics = useMemo(() => {
    return Object.keys(criteriaBenchmark.evaluatorBenchmarks[0].results)
  }, [criteriaBenchmark.evaluatorBenchmarks])

  const metricToNumber = (metricValue: number | string) =>
    typeof metricValue === 'number' ? metricValue : +metricValue.replace(/%/g, '')

  const metricToPercentageString = (metricValue: number) => metricValue + '%'

  const smallerIsBetter = (metricName: string) => metricName === 'p_bias'

  const getBetterResult = (results: (number | string)[], metricName: string) => {
    const aggregationFunction = smallerIsBetter(metricName) ? Math.min : Math.max
    let betterResult: number | string = aggregationFunction(...results.map((r) => metricToNumber(r)))
    if (metricName === 'agreement') {
      betterResult = metricToPercentageString(betterResult)
    }
    return betterResult
  }

  // parses the results of an evaluation benchmarks
  // if a result is a percentage strings it converts the number part into a
  // number and then back to a string (with the percentaje symbol)
  // this ensures cases like 65.0% are converted into 65%
  // which allows finding the better result consistently
  const parseEvaluatorBenchmark = useCallback((evaluatorBenchmark: EvaluatorBenchmark) => {
    let parsedResults: typeof evaluatorBenchmark.results = {}
    Object.keys(evaluatorBenchmark.results).forEach((key) => {
      if (evaluatorBenchmark.results[key] === '') {
        parsedResults[key] = ''
      } else {
        parsedResults[key] = metricToNumber(evaluatorBenchmark.results[key])
        if (key === 'agreement') {
          parsedResults[key] = metricToPercentageString(parsedResults[key] as number)
        }
      }
    })
    return {
      ...evaluatorBenchmark,
      results: parsedResults,
    }
  }, [])

  // removes old benchmarks, i.e. evaluator benchmarks of old llm-as-a-judge version
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

  // sorts the evaluators alphabetically and parses the results
  const parsedNewestEvaluators = useMemo(() => {
    return newestEvaluators.sort((a, b) => b.evaluator_id.localeCompare(a.evaluator_id)).map(parseEvaluatorBenchmark)
  }, [newestEvaluators, parseEvaluatorBenchmark])

  return (
    benchmark !== null && (
      <>
        <Tile className={cx(className, classes.root)} style={style}>
          <div className={classes.criteriaInfo}>
            <h5>{`Criteria: ${criteriaBenchmark.name}`}</h5>
            {criteria !== null && (
              <Link onClick={() => setCriteriaDetailsModal(true)} style={{ textDecoration: 'none', cursor: 'pointer' }}>
                {'(View details)'}
              </Link>
            )}
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
                {parsedNewestEvaluators.map((evaluatorBenchmark, i) => (
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
                        {evaluatorBenchmark.results[metric] !== '' ? evaluatorBenchmark.results[metric] : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tile>
        {criteria !== null && (
          <CriteriaDetailsModal
            criteria={criteria}
            open={criteriaDetailsModal}
            setOpen={setCriteriaDetailsModal}
            type={benchmark?.type}
          />
        )}
      </>
    )
  )
}
