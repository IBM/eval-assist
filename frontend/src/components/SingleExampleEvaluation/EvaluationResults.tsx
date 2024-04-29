import { CSSProperties } from 'react'

import {
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tile,
  Tooltip,
} from '@carbon/react'
import { Information } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { Result } from './types'

interface EvaluationResultsProps {
  results: Result[] | null
  evaluationFailed: boolean
  evaluationError: Error | null
  evaluationRunning: boolean
  style?: CSSProperties
}

export const EvaluationResults = ({
  results,
  evaluationFailed,
  evaluationError,
  evaluationRunning,
  style,
}: EvaluationResultsProps) => {
  const dataStyle = {
    padding: '1rem 1rem 1rem 1rem',
  }
  const headers = [
    'Response',
    'Criteria',
    'Value',
    <div key={3} style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
      Positional bias
      <Tooltip label={<p style={{ textAlign: 'center' }}>{'Positioanl bias bla bla'}</p>} align="top">
        <button style={{ backgroundColor: 'transparent', border: 'none' }}>
          <Information />
        </button>
      </Tooltip>
    </div>,
    'Explanation',
  ]
  return (
    <div style={style}>
      {evaluationFailed ? (
        <InlineNotification
          aria-label="closes notification"
          kind="error"
          onClose={function noRefCheck() {}}
          onCloseButtonClick={function noRefCheck() {}}
          statusIconDescription="notification"
          subtitle={evaluationError?.message}
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
                <TableRow key={i} style={{ backgroundColor: row.positionalBias ? '#f9dede' : '' }}>
                  <TableCell>{`${i}`}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.option}</TableCell>
                  <TableCell>{row.positionalBias ? 'True' : 'False'}</TableCell>
                  <TableCell>{row.explanation}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : !evaluationRunning ? (
        <p style={{ color: 'gray' }}>{'No results...'}</p>
      ) : null}
    </div>
  )
}
