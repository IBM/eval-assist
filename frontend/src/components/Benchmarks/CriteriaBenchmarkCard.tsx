import cx from 'classnames'

import { CSSProperties, useMemo, useState } from 'react'

import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
  Toggle,
  Tooltip,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'

import { useCriteriasContext } from '@providers/CriteriaProvider'
import { CriteriaBenchmark, EvaluationType, Version } from '@types'
import { capitalizeFirstWord, toTitleCase } from '@utils'

import classes from './CriteriaBenchmarkCard.module.scss'
import { CriteriaDetailsModal } from './CriteriaDetailsModal'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  criteriaBenchmark: CriteriaBenchmark
  className?: string
  style?: CSSProperties
  showCorrelationColumns: boolean
}

const beatutifyName: { [key: string]: string } = {
  accuracy: 'Accuracy',
  positional_bias_rate: 'Positional bias rate',
  pearson: 'Pearson',
  f1_macro: 'F1 macro',
}

export const CriteriaBenchmarkCard = ({ criteriaBenchmark, showCorrelationColumns, className, style }: Props) => {
  const { benchmark } = useURLInfoContext()
  const { getCriteria } = useCriteriasContext()
  const [criteriaDetailsModal, setCriteriaDetailsModal] = useState(false)
  // const [showAllVersions, setShowAllVersions] = useState(true)
  const criteria = useMemo(
    () => getCriteria(criteriaBenchmark.catalogCriteriaName, benchmark?.type as EvaluationType),
    [benchmark?.type, criteriaBenchmark.catalogCriteriaName, getCriteria],
  )

  const benchmarkMetrics = useMemo(() => {
    return Object.keys(criteriaBenchmark.evaluatorBenchmarks[0].results).filter(
      (metric) => showCorrelationColumns || !metric.startsWith('corr'),
    )
  }, [criteriaBenchmark.evaluatorBenchmarks, showCorrelationColumns])

  const benchmarkMetricsHeaders = useMemo(
    () =>
      benchmarkMetrics.map((metric, i) =>
        metric === 'pearson' ? (
          <div key={i} className={classes.headerWithTooltip}>
            {beatutifyName[metric]}
            <Tooltip
              label={
                <p style={{ textAlign: 'center' }}>
                  {'Calculate the Pearson correlation coefficient between the LLM rating and the human rating.'}
                </p>
              }
              align="top"
            >
              <Information className={classes.headerInfoIcon} />
            </Tooltip>
          </div>
        ) : (
          beatutifyName[metric] || capitalizeFirstWord(metric)
        ),
      ),
    [benchmarkMetrics],
  )

  const metricToPercentageString = (metricValue: number) => Math.round(metricValue * 1000) / 10 + '%'

  const smallerIsBetter = (metricName: string) => metricName === 'positional_bias_rate'

  const getBetterResult = (results: number[], metricName: string) => {
    const aggregationFunction = smallerIsBetter(metricName) ? Math.min : Math.max
    let betterResult: number | string = aggregationFunction(...results)
    return betterResult
  }

  const parseResult = (metric: string, result: number): number | string => {
    return result !== null ? Math.round(result * 100) / 100 : '-'
  }

  // removes old benchmarks, i.e. evaluator benchmarks of old llm-as-a-judge version
  const newestEvaluators = useMemo(
    () =>
      // criteriaBenchmark.evaluatorBenchmarks.filter((e) => {
      //   const repeatedEvaluators = criteriaBenchmark.evaluatorBenchmarks.filter(
      //     (ev) => ev.evaluator_id === e.evaluator_id,
      //   )

      //   repeatedEvaluators.sort((a, b) => {
      //     return new Version(b.laaj_version) > new Version(a.laaj_version) ? 1 : -1
      //   })

      //   return e.laaj_version === repeatedEvaluators[0].laaj_version
      // }),
      criteriaBenchmark.evaluatorBenchmarks,
    [criteriaBenchmark.evaluatorBenchmarks],
  )

  const displayedEvaluators = useMemo(
    () => criteriaBenchmark.evaluatorBenchmarks.sort((a, b) => a.name.localeCompare(b.name)),
    [criteriaBenchmark.evaluatorBenchmarks],
  )

  return (
    benchmark !== null && (
      <>
        <Tile className={cx(className, classes.root)} style={style}>
          <div className={classes.criteriaHeader}>
            <div className={classes.criteriaInfo}>
              <h5>{`Criteria: ${capitalizeFirstWord(criteriaBenchmark.name)}`}</h5>
              {criteria !== null && (
                <Link
                  onClick={() => setCriteriaDetailsModal(true)}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                >
                  {'(View details)'}
                </Link>
              )}
            </div>
          </div>

          <div className={cx(classes.table)}>
            <Table size="lg" useZebraStyles={false}>
              <TableHead>
                <TableRow>
                  <TableHeader key={0}>{'Evaluator'}</TableHeader>
                  {benchmarkMetricsHeaders.map((metric, i) => (
                    <TableHeader key={i}>{metric}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedEvaluators.map((evaluatorBenchmark, i) => (
                  <TableRow key={i}>
                    {/* <TableCell>{`${evaluatorBenchmark.evaluator_id} (v${evaluatorBenchmark.laaj_version})`}</TableCell> */}
                    <TableCell>{toTitleCase(evaluatorBenchmark.name)}</TableCell>
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
                        {parseResult(metric, evaluatorBenchmark.results[metric])}
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
