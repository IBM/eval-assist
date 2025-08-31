import cx from 'classnames'

import { CSSProperties, useMemo, useState } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tile, Tooltip } from '@carbon/react'
import { Information } from '@carbon/react/icons'

import { useCriteriasContext } from '@providers/CriteriaProvider'
import { GroupByValueResult } from '@types'
import { capitalizeFirstWord, splitDotsAndCapitalizeFirstWord, toTitleCase } from '@utils'

import classes from './CriteriaBenchmarkCard.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  groupByField: string
  groupByValue: string
  groupByValueResult: GroupByValueResult
  className?: string
  style?: CSSProperties
}

const beatutifyName: { [key: string]: string } = {
  accuracy: 'Accuracy',
  positional_bias_rate: 'Positional bias rate',
  pearson: 'Pearson',
  f1_macro: 'F1 macro',
}

export const GroupByValueResultCard = ({ groupByField, groupByValue, groupByValueResult, className, style }: Props) => {
  const { benchmark } = useURLInfoContext()
  const { getCriteria } = useCriteriasContext()
  const [criteriaDetailsModal, setCriteriaDetailsModal] = useState(false)
  // const [showAllVersions, setShowAllVersions] = useState(true)
  // const criteria = useMemo(
  //   () => getCriteria(criteriaBenchmark.catalogCriteriaName, benchmark?.type as EvaluationType),
  //   [benchmark?.type, criteriaBenchmark.catalogCriteriaName, getCriteria],
  // )

  const metrics = useMemo(
    () => Object.keys(Object.values(groupByValueResult.judgeResults)[0].results),
    [groupByValueResult],
  )

  const benchmarkMetricsHeaders = useMemo(
    () =>
      metrics.map((metric, i) =>
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
          beatutifyName[metric] || splitDotsAndCapitalizeFirstWord(metric)
        ),
      ),
    [metrics],
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

  const judgeResults = useMemo(
    () =>
      Object.values(groupByValueResult.judgeResults).sort((a, b) =>
        a.model.localeCompare(b.model) !== 0 ? a.model.localeCompare(b.model) : a.judge.localeCompare(b.judge),
      ),
    [groupByValueResult.judgeResults],
  )

  return (
    benchmark !== null && (
      <>
        <Tile className={cx(className, classes.root)} style={style}>
          <div className={classes.criteriaHeader}>
            <div className={classes.criteriaInfo}>
              <h5>{`${capitalizeFirstWord(groupByField)}: ${splitDotsAndCapitalizeFirstWord(groupByValue)}`}</h5>
              {/* {criteria !== null && (
                <Link
                  onClick={() => setCriteriaDetailsModal(true)}
                  style={{ textDecoration: 'none', cursor: 'pointer' }}
                >
                  {'(View details)'}
                </Link>
              )} */}
            </div>
            <p
              style={{ paddingTop: '0.5rem', fontStyle: 'italic', color: 'gray' }}
            >{`Number of instances: ${groupByValueResult.datasetLen}`}</p>
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
                {judgeResults.map((judgeResult, i) => (
                  <TableRow key={i}>
                    <TableCell>{toTitleCase(`${judgeResult.model} (${judgeResult.judge})`)}</TableCell>
                    {metrics.map((metric) => (
                      <TableCell
                        key={metric}
                        className={cx({
                          [classes.highlightedCellText]:
                            judgeResult.results[metric] ===
                            getBetterResult(
                              judgeResults.map((e) => e.results[metric]),
                              metric,
                            ),
                        })}
                      >
                        {parseResult(metric, judgeResult.results[metric])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tile>
        {/* {criteria !== null && (
          <CriteriaDetailsModal
            criteria={criteria}
            open={criteriaDetailsModal}
            setOpen={setCriteriaDetailsModal}
            type={benchmark?.type}
          />
        )} */}
      </>
    )
  )
}
