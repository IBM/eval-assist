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
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { Result } from './types'

interface EvaluationResultsProps {
  results: Result[] | null
  evaluationFailed: boolean
  evaluationError: string
  evaluationRunning: boolean
  style?: CSSProperties
  className?: string
}

export const EvaluationResults = ({
  results,
  evaluationFailed,
  evaluationError,
  evaluationRunning,
  style,
  className,
}: EvaluationResultsProps) => {
  const headers = [
    'Response',
    'Criteria',
    'Value',
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
      ) : results !== null ? (
        <div className={classes['table-wrapper']}>
          <Table size="lg" useZebraStyles={false} aria-label="sample table">
            <TableHead>
              <TableRow>
                {headers.map((header, i) => (
                  <TableHeader key={i}>{header}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((row, i) => (
                <TableRow key={i} className={row.positionalBias ? classes['table-row-error'] : ''}>
                  <TableCell>{`${i + 1}`}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.option}</TableCell>
                  <TableCell>{row.positionalBias ? 'True' : 'False'}</TableCell>
                  <TableCell>{row.explanation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
