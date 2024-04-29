import { CSSProperties } from 'react'

import { InlineNotification, Tile } from '@carbon/react'

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

  const columnNames = ['Criteria', 'Value', 'Explanation']
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
        <Tile
          style={{
            display: 'grid',
            gridTemplateColumns: '10% 10% 80%',
          }}
        >
          {columnNames.map((c, i) => (
            <div style={{ padding: '1rem' }} key={i}>
              <h5>{c}</h5>
            </div>
          ))}
          {results !== null && (
            <>
              {results.map((result) => (
                <>
                  <div style={dataStyle}>{result.name}</div>
                  <div style={dataStyle}>{result.option}</div>
                  <p style={dataStyle}>{result.explanation}</p>
                </>
              ))}
            </>
          )}
        </Tile>
      ) : !evaluationRunning ? (
        <p style={{ color: 'gray' }}>{'No results...'}</p>
      ) : null}
    </div>
  )
}
