import { CSSProperties } from 'react'

import {
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'

import { PairwiseCriteria, PairwiseResult, PipelineType, RubricResult } from '../../utils/types'
import classes from './SingleExampleEvaluation.module.scss'

interface EvaluationResultsProps {
  results: (RubricResult | PairwiseResult)[] | null
  evaluationFailed: boolean
  evaluationError: string
  evaluationRunning: boolean
  style?: CSSProperties
  className?: string
  type: PipelineType
}

export const EvaluationResults = ({
  results,
  evaluationFailed,
  evaluationError,
  evaluationRunning,
  style,
  className,
  type,
}: EvaluationResultsProps) => {
  const rubricResultsHeaders = [
    'Response',
    'Criteria',
    'Value',
    <div key={3} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
      Positional bias
      <Tooltip
        label={
          <p style={{ textAlign: 'center' }}>
            {
              'Positional bias occurs when the LLM evaluator is unable to consistently choose a preferred response. Results that exhibit positional bias are uncertain and cannot be trusted.'
            }
          </p>
        }
        align="top"
      >
        <button style={{ backgroundColor: 'transparent', border: 'none' }}>
          <Information />
        </button>
      </Tooltip>
    </div>,
    // 'Entropy',
    'Explanation',
  ]

  const pairwiseResultsHeaders = [
    'Criteria',
    'Win',
    <div key={3} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
      Positional bias
      <Tooltip
        label={
          <p style={{ textAlign: 'center' }}>
            {
              'Positional bias occurs when the LLM evaluator is unable to consistenly choose a rubric value. Results that exhibit positional bias are uncertain and cannot be trusted.'
            }
          </p>
        }
        align="top"
      >
        <button style={{ backgroundColor: 'transparent', border: 'none' }}>
          <Information />
        </button>
      </Tooltip>
    </div>,
    // 'Entropy',
    'Explanation',
  ]

  return (
    <div style={style} className={className}>
      {evaluationFailed ? (
        <InlineNotification
          aria-label="closes notification"
          kind="error"
          onClose={function noRefCheck() {}}
          onCloseButtonClick={function noRefCheck() {}}
          statusIconDescription="notification"
          subtitle={evaluationError}
          title="Evaluation failed"
        />
      ) : !evaluationRunning && results !== null ? (
        <div className={classes['table-wrapper']}>
          <Table size="lg" useZebraStyles={false} aria-label="sample table">
            <TableHead>
              {type === PipelineType.RUBRIC ? (
                <TableRow>
                  {rubricResultsHeaders.map((header, i) => (
                    <TableHeader key={i}>{header}</TableHeader>
                  ))}
                </TableRow>
              ) : (
                <TableRow>
                  {pairwiseResultsHeaders.map((header, i) => (
                    <TableHeader key={i}>{header}</TableHeader>
                  ))}
                </TableRow>
              )}
            </TableHead>
            {type === PipelineType.RUBRIC ? (
              <TableBody>
                {results.map((row, i) => (
                  <TableRow key={i} className={row.positionalBias ? classes['table-row-error'] : ''}>
                    <TableCell>{`${i + 1}`}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>{(row as RubricResult).option}</TableCell>
                    <TableCell>{row.positionalBias ? 'True' : 'False'}</TableCell>
                    {/* <TableCell>{row.entropy.toFixed(3)}</TableCell> */}
                    <TableCell>{row.explanation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                {results.map((row, i) => (
                  <TableRow key={i} className={row.positionalBias ? classes['table-row-error'] : ''}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>{`Response #${
                      (row as PairwiseResult).winnerIndex + 1
                    }`}</TableCell>
                    <TableCell>{row.positionalBias ? 'True' : 'False'}</TableCell>
                    {/* <TableCell>{row.entropy.toFixed(3)}</TableCell> */}
                    <TableCell>{row.explanation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      ) : null}
    </div>
  )
}
