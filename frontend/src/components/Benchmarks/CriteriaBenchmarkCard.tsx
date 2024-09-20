import cx from 'classnames'

import { CSSProperties, useCallback, useMemo, useState } from 'react'

import {
  IconButton,
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

import { CriteriaBenchmark, EvaluatorBenchmark, PipelineType, Version } from '@types'
import { getCriteria } from '@utils/utils'

import classes from './CriteriaBenchmarkCard.module.scss'
import { CriteriaDetailsModal } from './CriteriaDetailsModal'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  criteriaBenchmark: CriteriaBenchmark
  className?: string
  style?: CSSProperties
}

const beatutifyName: { [key: string]: string } = {
  agreement: 'Agreement',
  p_bias: 'Positional bias',
  pearson: 'Pearson',
}

export const CriteriaBenchmarkCard = ({ criteriaBenchmark, className, style }: Props) => {
  const { benchmark } = useURLInfoContext()
  const [criteriaDetailsModal, setCriteriaDetailsModal] = useState(false)
  const [showAllVersions, setShowAllVersions] = useState(false)
  const criteria = useMemo(
    () => getCriteria(criteriaBenchmark.name, benchmark?.type as PipelineType),
    [benchmark?.type, criteriaBenchmark.name],
  )

  const benchmarkMetrics = useMemo(() => {
    return Object.keys(criteriaBenchmark.evaluatorBenchmarks[0].results)
  }, [criteriaBenchmark.evaluatorBenchmarks])

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
          beatutifyName[metric]
        ),
      ),
    [benchmarkMetrics],
  )

  const metricToPercentageString = (metricValue: number) => Math.round(metricValue * 1000) / 10 + '%'

  const smallerIsBetter = (metricName: string) => metricName === 'p_bias'

  const getBetterResult = (results: number[], metricName: string) => {
    const aggregationFunction = smallerIsBetter(metricName) ? Math.min : Math.max
    let betterResult: number | string = aggregationFunction(...results)
    return betterResult
  }

  const parseResult = (metric: string, result: number): number | string =>
    metric === 'agreement' || metric === 'p_bias' ? metricToPercentageString(result) : result

  // removes old benchmarks, i.e. evaluator benchmarks of old llm-as-a-judge version
  const newestEvaluators = useMemo(
    () =>
      criteriaBenchmark.evaluatorBenchmarks.filter((e) => {
        const repeatedEvaluators = criteriaBenchmark.evaluatorBenchmarks.filter(
          (ev) => ev.evaluator_id === e.evaluator_id,
        )

        repeatedEvaluators.sort((a, b) => {
          return new Version(b.laaj_version) > new Version(a.laaj_version) ? 1 : -1
        })

        return e.laaj_version === repeatedEvaluators[0].laaj_version
      }),
    [criteriaBenchmark.evaluatorBenchmarks],
  )

  // sorts the evaluators alphabetically and parses the results
  const parsedNewestEvaluators = useMemo(() => {
    return (showAllVersions ? criteriaBenchmark.evaluatorBenchmarks : newestEvaluators).sort((a, b) =>
      a.evaluator_id.localeCompare(b.evaluator_id),
    )
  }, [criteriaBenchmark.evaluatorBenchmarks, newestEvaluators, showAllVersions])

  return (
    benchmark !== null && (
      <>
        <Tile className={cx(className, classes.root)} style={style}>
          <div className={classes.criteriaHeader}>
            <div className={classes.criteriaInfo}>
              <h5>{`Criteria: ${criteriaBenchmark.name}`}</h5>
              {criteria !== null && (
                <Link
                  onClick={() => setCriteriaDetailsModal(true)}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                >
                  {'(View details)'}
                </Link>
              )}
            </div>
            <Toggle
              labelText={'Show all versions'}
              toggled={showAllVersions}
              onToggle={() => setShowAllVersions(!showAllVersions)}
              size="sm"
              hideLabel
              id="toggle-expected-result"
              className={classes.toggle}
            />
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
                {parsedNewestEvaluators.map((evaluatorBenchmark, i) => (
                  <TableRow key={i}>
                    {/* <TableCell>{`${evaluatorBenchmark.evaluator_id} (v${evaluatorBenchmark.laaj_version})`}</TableCell> */}
                    <TableCell>{`${evaluatorBenchmark.evaluator_id} (${evaluatorBenchmark.laaj_version})`}</TableCell>
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
