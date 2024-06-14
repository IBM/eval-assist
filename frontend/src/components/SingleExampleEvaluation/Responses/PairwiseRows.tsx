import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Link, Tag } from '@carbon/react'
import { ZoomIn } from '@carbon/react/icons'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'
import { ResponsiveTextArea } from '@components/ResponsiveTextArea/ResponsiveTextArea'

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
}

export const PairwiseRows = ({
  responses,
  setResponses,
  results,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  pairwiseWinnerIndex,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    if (results !== null && results[0] !== undefined && pairwiseWinnerIndex === i && !explanationOn) {
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
            [classes.tableRowWithResults]: results !== null,
            [classes.tableRowWithExplanation]: results !== null && explanationOn,
            [classes.winnerResponseOutline]: i === pairwiseWinnerIndex,
          })}
        >
          <ResponsiveTextArea
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
          {results !== null && (
            <>
              <div
                className={cx(classes.blockElement, classes.resultBlock, {
                  [classes.resultBlockPointerCursor]:
                    results !== null && !explanationOn && results[0] !== undefined && pairwiseWinnerIndex === i,
                  [classes.resultBlockGradient]:
                    results !== null && !explanationOn && results[0] !== undefined && pairwiseWinnerIndex === i,
                  [classes.resultBlockHover]: !explanationOn && i === pairwiseWinnerIndex,
                })}
                onClick={() => onResultBlockClick(i)}
                tabIndex={-1}
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%' }}>
                    <p
                      className={cx(classes.resultBlockTypography, {
                        [classes.resultPlaceholder]: results === null || results[0] === undefined,
                        [classes.resultBlockDefaultCursor]:
                          !explanationOn && (results === null || results[0] === undefined),
                        [classes.untrastedResult]: results !== null && results[0].positionalBias,
                      })}
                    >
                      {getResultToDisplay(i) ?? 'The results will appear here.'}
                    </p>
                    {results !== null && pairwiseWinnerIndex === i && results[0].positionalBias && (
                      <Tag
                        className={cx(classes.positionalBiasTag, {
                          [classes.resultBlockPointerCursor]: results !== null && results[0] && !explanationOn,
                          [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                        })}
                        type="red"
                      >
                        {'Positional bias: Yes'}
                      </Tag>
                    )}

                    {results !== null && pairwiseWinnerIndex === i && !results[0].positionalBias && (
                      <Tag
                        className={cx(classes.positionalBiasTag, {
                          [classes.resultBlockPointerCursor]: results !== null && results[0] && !explanationOn,
                          [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                        })}
                        type="green"
                      >
                        {'Positional bias: No'}
                      </Tag>
                    )}
                  </div>
                  {results !== null && !explanationOn && results[0] !== undefined && pairwiseWinnerIndex === i && (
                    <Link
                      style={{ alignSelft: 'flex-end' }}
                      className={classes.resultDetailsAction}
                      renderIcon={() => <ZoomIn />}
                    >
                      View Detail
                    </Link>
                  )}
                </div>
              </div>
              {explanationOn && (
                <ResponsiveTextArea
                  readOnly
                  value={
                    results !== null && results[0] !== undefined && pairwiseWinnerIndex === i
                      ? results[0].explanation
                      : undefined
                  }
                  labelText={''}
                  placeholder={results === null ? 'The evaluator explanation will appear here' : ''}
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
