import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Button, Link, Tag } from '@carbon/react'
import { Add, ZoomIn } from '@carbon/react/icons'

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
}

export const RubricRows = ({
  responses,
  setResponses,
  results,
  onRemoveResponse,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    if (results !== null && results[i] !== undefined && !explanationOn) {
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
                [classes.tableRowWithResults]: results !== null,
                [classes.tableRowWithExplanation]: results !== null && explanationOn,
              })}
            >
              <FlexTextArea
                onChange={(e) => {
                  setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])
                }}
                rows={4}
                value={response}
                id="text-area-model-output"
                labelText={''}
                placeholder="The response/text to evaluate."
                key={`${i}_1`}
                onFocus={setActive}
                onBlur={setInactive}
                className={cx(classes.blockElement)}
              />
              {results !== null && (
                <>
                  <div
                    className={cx(classes.blockElement, classes.resultBlock, {
                      [classes.resultBlockPointerCursor]:
                        results !== null && !explanationOn && results[i] !== undefined,
                      [classes.resultBlockGradient]: results !== null && !explanationOn && results[i] !== undefined,

                      [classes.resultBlockHover]: !explanationOn,
                    })}
                    onClick={() => onResultBlockClick(i)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', height: '100%' }}
                      >
                        <p
                          className={cx(classes.resultBlockTypography, {
                            [classes.resultPlaceholder]: results === null || results[i] === undefined,
                            [classes.resultBlockDefaultCursor]:
                              !explanationOn && (results === null || results[i] === undefined),
                            [classes.untrastedResult]: results !== null && results[i]?.positionalBias,
                          })}
                          onFocus={setActive}
                          onBlur={setInactive}
                        >
                          {getResultToDisplay(i) ?? 'The results will appear here.'}
                        </p>
                        {results !== null && results[i] && results[i].positionalBias && (
                          <Tag
                            className={cx(classes.positionalBiasTag, {
                              [classes.resultBlockPointerCursor]: results !== null && results[i] && !explanationOn,
                              [classes.resultBlockDefaultCursor]: results === null || results[i] === undefined,
                            })}
                            type="red"
                          >
                            {'Positional bias: Yes'}
                          </Tag>
                        )}

                        {results !== null && results[i] !== undefined && !results[i].positionalBias && (
                          <Tag
                            className={cx(classes.positionalBiasTag, {
                              [classes.resultBlockPointerCursor]: results !== null && results[i] && !explanationOn,
                              [classes.resultBlockDefaultCursor]: results === null || results[i] === undefined,
                            })}
                            type="green"
                          >
                            {'Positional bias: No'}
                          </Tag>
                        )}
                      </div>
                      {results !== null && !explanationOn && results[i] !== undefined && (
                        <Link
                          style={{ alignSelf: 'flex-end' }}
                          className={classes.resultDetailsAction}
                          renderIcon={() => <ZoomIn />}
                        >
                          View Detail
                        </Link>
                      )}
                    </div>
                  </div>
                  {explanationOn && (
                    <FlexTextArea
                      readOnly
                      value={
                        results !== null ? (results[i] !== undefined ? results[i].explanation : undefined) : undefined
                      }
                      labelText={''}
                      placeholder={
                        results === null || results[i] === undefined ? 'The evaluator explanation will appear here' : ''
                      }
                      key={`rubric_${i}_3_${uuid()}`}
                      id={`rubric_${i}_3_${uuid()}`}
                      onFocus={setActive}
                      onBlur={setInactive}
                      className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
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
