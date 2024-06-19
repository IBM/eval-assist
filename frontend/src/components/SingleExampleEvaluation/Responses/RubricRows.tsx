import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Button, Link } from '@carbon/react'
import { Add } from '@carbon/react/icons'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'

import RemovableSection from '../../RemovableSection/RemovableSection'
import { PairwiseResult, RubricResult } from '../types'
import classes from './index.module.scss'

interface Props {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  results: RubricResult[] | null
  onRemoveResponse: (i: number) => void
  explanationOn: boolean
  setSelectedResultDetails: Dispatch<SetStateAction<RubricResult | PairwiseResult | null>>
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
}

export const RubricRows = ({
  responses,
  setResponses,
  results,
  onRemoveResponse,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  evaluationRunning,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    // if (results !== null && results[i] !== undefined && !explanationOn) {
    if (results !== null && results[i] !== undefined) {
      setSelectedResultDetails(results[i])
      setResultDetailsModalOpen(true)
    }
  }
  const getResultToDisplay = (i: number) => {
    if (results !== null) {
      return results[i] ? (results[i] as RubricResult).option : null
    }
  }
  return (
    <>
      {responses?.map((response, i) => (
        <RemovableSection key={i} onRemove={() => onRemoveResponse(i)} readOnly={responses.length === 1}>
          {({ setActive, setInactive }) => (
            <div
              key={i}
              className={cx(classes.tableRow, classes.responsesRow, {
                [classes.tableRowWithResults]: results !== null && !evaluationRunning,
                [classes.tableRowWithExplanation]: results !== null && !evaluationRunning && explanationOn,
              })}
            >
              <FlexTextArea
                onChange={(e) => {
                  setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])
                }}
                value={response}
                id="text-area-model-output"
                labelText={''}
                placeholder="The response/text to evaluate."
                key={`${i}_1`}
                onFocus={setActive}
                onBlur={setInactive}
                className={cx(classes.blockElement)}
              />
              {results !== null && !evaluationRunning && (
                <>
                  <div
                    className={cx(classes.blockElement, classes.resultBlock, {
                      [classes.resultBlockPointerCursor]: results[i] !== undefined,

                      [classes.resultBlockHover]: true,
                    })}
                    onClick={() => onResultBlockClick(i)}
                    tabIndex={-1}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          height: '100%',
                          gap: '5px',
                        }}
                      >
                        <div
                          className={cx(classes.resultBlockTypography, {
                            [classes.resultPlaceholder]: results[i] === undefined,
                            [classes.resultBlockDefaultCursor]: results[i] === undefined,
                            [classes.untrastedResult]: results[i]?.positionalBias,
                          })}
                          onFocus={setActive}
                          onBlur={setInactive}
                        >
                          {getResultToDisplay(i) ? <strong>{getResultToDisplay(i)}</strong> : ''}
                        </div>
                        {results[i] && (
                          <div
                            className={cx({
                              [classes.positionalBias]: results[i].positionalBias,
                              [classes.softText]: !results[i].positionalBias,
                            })}
                          >
                            {results[i].positionalBias ? 'Positional bias detected' : 'No positional bias'}
                          </div>
                        )}
                        {results[i] && results[i].certainty && (
                          <div className={cx(classes.softText)}>
                            {'Certainty: ' + ((results[i].certainty as number) * 100).toFixed(0) + '%'}
                          </div>
                        )}
                      </div>
                      {results[i] !== undefined && (
                        <Link style={{ alignSelf: 'flex-end' }} className={classes.resultDetailsAction}>
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                  {results !== null && !evaluationRunning && explanationOn && (
                    <FlexTextArea
                      readOnly
                      value={results[i] !== undefined ? results[i].explanation : undefined}
                      labelText={''}
                      // placeholder={
                      //   results === null || results[i] === undefined
                      //     ? 'Explanation will appear here'
                      //     : ''
                      // }
                      placeholder=""
                      key={`rubric_${i}_3_${uuid()}`}
                      id={`rubric_${i}_3_${uuid()}`}
                      onFocus={setActive}
                      onBlur={setInactive}
                      className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
                      tabIndex={-1}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </RemovableSection>
      ))}
      <div className={classes.tableRow}>
        <div className={cx(classes.blockElement, classes.addResponseBlock)}>
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={(e) => setResponses([...responses, ''])}>
            {'Add response'}
          </Button>
        </div>
      </div>
    </>
  )
}
