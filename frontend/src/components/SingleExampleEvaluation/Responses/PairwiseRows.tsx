import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Link } from '@carbon/react'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'

import { PairwiseResult, RubricResult } from '../types'
import classes from './index.module.scss'

interface Props {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  results: PairwiseResult[] | null
  explanationOn: boolean
  setSelectedResultDetails: Dispatch<SetStateAction<RubricResult | PairwiseResult | null>>
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  pairwiseWinnerIndex: number | null
  evaluationRunning: boolean
}

export const PairwiseRows = ({
  responses,
  setResponses,
  results,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  pairwiseWinnerIndex,
  evaluationRunning,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    if (results !== null && results[0] !== undefined && pairwiseWinnerIndex === i) {
      setSelectedResultDetails(results[0])
      setResultDetailsModalOpen(true)
    }
  }

  const getResultToDisplay = (i: number) => {
    if (results !== null) {
      return i === pairwiseWinnerIndex ? 'Winner' : ''
    }
  }

  return (
    <>
      {responses?.map((response, i) => (
        <div
          key={i}
          className={cx(classes.tableRow, classes.responsesRow, {
            [classes.tableRowWithResults]: results !== null && !evaluationRunning,
            [classes.tableRowWithExplanation]: results !== null && !evaluationRunning && explanationOn,
            [classes.winnerResponseOutline]: !evaluationRunning && i === pairwiseWinnerIndex,
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
            className={cx(classes.blockElement)}
          />
          {results !== null && !evaluationRunning && (
            <>
              <div
                className={cx(classes.blockElement, classes.resultBlock, {
                  [classes.resultBlockPointerCursor]: results[0] !== undefined && pairwiseWinnerIndex === i,
                  [classes.resultBlockGradient]: results[0] !== undefined && pairwiseWinnerIndex === i,
                  [classes.resultBlockHover]: i === pairwiseWinnerIndex,
                })}
                onClick={() => onResultBlockClick(i)}
                tabIndex={-1}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%' }}>
                    <p
                      className={cx(classes.resultBlockTypography, {
                        [classes.resultPlaceholder]: results === null || results[0] === undefined,
                        [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                        [classes.untrastedResult]:
                          results !== null && 'positionalBias' in results && results[0].positionalBias,
                      })}
                    >
                      {getResultToDisplay(i) ? <strong>{getResultToDisplay(i)}</strong> : ''}
                    </p>
                    {pairwiseWinnerIndex === i && results[0].positionalBias && (
                      // <Tag
                      //   className={cx(classes.positionalBiasTag, {
                      //     [classes.resultBlockPointerCursor]: results !== null && results[0] && !explanationOn,
                      //     [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                      //   })}
                      //   type="red"
                      // >
                      //   {'Positional bias: Yes'}
                      // </Tag>
                      <div className={cx(classes.positionalBiasLink)}>
                        {/* <a
                          href="/documentation/#positional-bias"
                          className={cx(classes.positionalBiasLink)}
                          style={{ fontSize: 'small' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        > */}
                        Positional bias
                        {/* </a> */}
                      </div>
                    )}

                    {results[0] !== undefined && results[0].certainty && pairwiseWinnerIndex === i && (
                      <div className={cx(classes.certainty)}>
                        {'Certainty: ' + ((results[0].certainty as number) * 100).toFixed(0) + '%'}
                      </div>
                    )}

                    {/* {results !== null && pairwiseWinnerIndex === i && !results[0].positionalBias && (
                      <Tag
                        className={cx(classes.positionalBiasTag, {
                          [classes.resultBlockPointerCursor]: results !== null && results[0] && !explanationOn,
                          [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                        })}
                        type="green"
                      >
                        {'Positional bias: No'}
                      </Tag>
                    )} */}
                  </div>
                  {results[0] !== undefined && pairwiseWinnerIndex === i && (
                    <Link
                      style={{ alignSelft: 'flex-end' }}
                      className={classes.resultDetailsAction}
                      // renderIcon={() => <ZoomIn />}
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
              {explanationOn && !evaluationRunning && (
                <FlexTextArea
                  readOnly
                  value={results[0] !== undefined && pairwiseWinnerIndex === i ? results[0].explanation : undefined}
                  labelText={''}
                  // placeholder={results === null ? 'The evaluator explanation will appear here' : ''}
                  placeholder={''}
                  key={`pairwise_${i}_3_${uuid()}`}
                  id={`pairwise_${i}_3_${uuid()}`}
                  className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
                  tabIndex={-1}
                />
              )}
            </>
          )}
        </div>
      ))}
    </>
  )
}
