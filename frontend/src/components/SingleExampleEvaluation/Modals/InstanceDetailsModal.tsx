import cx from 'classnames'
import { capitalizeFirstWord, getOrdinalSuffix, returnByPipelineType, toPercentage, toTitleCase } from 'src/utils'

import { Dispatch, Fragment, SetStateAction, useEffect, useMemo, useState } from 'react'
import React from 'react'
import Markdown from 'react-markdown'

import { Accordion, AccordionItem, Layer, ListItem, Modal, Tooltip, UnorderedList } from '@carbon/react'
import { ArrowRight, Warning } from '@carbon/react/icons'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'

import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  PairwiseInstance,
  PairwiseInstanceResult,
} from '../../../types'
import classes from './InstanceDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const InstanceDetailsModal = ({ open, setOpen }: Props) => {
  const { currentTestCase, selectedInstance, setSelectedInstance } = useCurrentTestCase()
  const onClose = () => {
    setOpen(false)
    setSelectedInstance(null)
  }

  const positionalBiasDetected = useMemo(() => {
    if (selectedInstance === null || selectedInstance.result === null) return null
    return returnByPipelineType(
      currentTestCase.type,
      () => (selectedInstance.result as DirectInstanceResult).positionalBias.detected,
      () =>
        Object.values(selectedInstance.result as PairwiseInstanceResult).some((instance) =>
          instance.positionalBias.some((pb) => pb),
        ),
    )
  }, [currentTestCase.type, selectedInstance])

  const [openedPerReponseResults, setOpenedPerReponseResults] = useState<boolean[]>([])

  useEffect(() => {
    if (selectedInstance === null || currentTestCase.type === EvaluationType.DIRECT || !selectedInstance.result)
      return setOpenedPerReponseResults([])
    setOpenedPerReponseResults(Object.keys(selectedInstance.result as PairwiseInstanceResult).map((_) => false))
  }, [currentTestCase.type, selectedInstance])
  return (
    selectedInstance !== null && (
      <Modal open={open} onRequestClose={onClose} passiveModal size="lg" modalHeading={`Instance details`}>
        <Layer>
          <Accordion className={classes.accordionFullWidth}>
            <AccordionItem title="Test data" open key={'test-data'}>
              <div className={cx(classes.gridTemplate)}>
                {selectedInstance.contextVariables.map((contectVariable, i) => (
                  <Fragment key={`context-var-${i}`}>
                    <p key={`${i}_0`}>
                      <strong>{`${toTitleCase(contectVariable.name)}:`}</strong>
                    </p>
                    <p key={`${i}_1`}>{contectVariable.value}</p>
                  </Fragment>
                ))}
                {currentTestCase.type === EvaluationType.DIRECT && (
                  <>
                    <p>
                      <strong>{`${toTitleCase(currentTestCase.criteria.predictionField)}:`}</strong>
                    </p>
                    <p>{(selectedInstance as DirectInstance).response}</p>
                  </>
                )}

                {currentTestCase.type === EvaluationType.PAIRWISE &&
                  (selectedInstance as PairwiseInstance).responses.map((response, i) => (
                    <Fragment key={`response-${i}`}>
                      <p>
                        <strong>{`${toTitleCase(currentTestCase.criteria.predictionField)} ${i + 1}`}</strong>
                      </p>
                      <p>{response}</p>
                    </Fragment>
                  ))}
              </div>
            </AccordionItem>
            <AccordionItem title={`Criteria: ${currentTestCase.criteria.name}`} open key={'criteria'}>
              <div className={cx(classes.gridTemplate)}>
                <p>
                  <strong>{'Description:'}</strong>
                </p>
                <p>{currentTestCase.criteria.description}</p>
              </div>{' '}
            </AccordionItem>
            <AccordionItem title="Results" open key={'results'}>
              {selectedInstance.result ? (
                <div className={cx(classes.gridTemplate)}>
                  <>
                    {currentTestCase.type === EvaluationType.DIRECT && (
                      <>
                        {selectedInstance.expectedResult !== '' && (
                          <>
                            <p>
                              <strong>{'Expected result: '}</strong>
                            </p>
                            <p>{selectedInstance.expectedResult}</p>
                          </>
                        )}

                        <p>
                          <strong>{'Result: '}</strong>
                        </p>
                        <p>{(selectedInstance.result as DirectInstanceResult).option}</p>

                        <p>
                          <strong>Explanation:</strong>
                        </p>
                        <div>
                          <Markdown>{(selectedInstance.result as DirectInstanceResult).explanation}</Markdown>
                        </div>
                        {(selectedInstance.result as DirectInstanceResult).feedback && (
                          <>
                            <p>
                              <strong>Feedback:</strong>
                            </p>
                            <div>
                              <Markdown>{(selectedInstance.result as DirectInstanceResult).feedback}</Markdown>
                            </div>
                          </>
                        )}
                        {/* <p>{(selectedInstance.result as DirectInstanceResult).explanation}</p> */}
                        <p>
                          <strong>{'Positional bias:'}</strong>
                        </p>
                        <p
                          className={cx({
                            [classes.errorText]: positionalBiasDetected,
                          })}
                        >
                          {positionalBiasDetected ? 'Detected' : 'Not detected'}
                        </p>
                        {(selectedInstance.result as DirectInstanceResult).positionalBias.detected && (
                          <>
                            <p>
                              <strong>{'Positional bias result:'}</strong>
                            </p>
                            <p>{(selectedInstance.result as DirectInstanceResult).positionalBias.option}</p>

                            <p>
                              <strong>{'Positional bias explanation:'}</strong>
                            </p>
                            <div>
                              <Markdown>
                                {(selectedInstance.result as DirectInstanceResult).positionalBias.explanation}
                              </Markdown>
                            </div>
                          </>
                        )}
                        {selectedInstance.result.metadata && (
                          <>
                            {Object.entries(selectedInstance.result.metadata).map(([k, v], i) => (
                              <React.Fragment key={i}>
                                <p>
                                  <strong>{`${capitalizeFirstWord(k)}:`}</strong>
                                </p>
                                <p style={{ whiteSpace: 'pre-line' }}>{capitalizeFirstWord(v)}</p>
                              </React.Fragment>
                            ))}
                          </>
                        )}
                      </>
                    )}

                    {currentTestCase.type === EvaluationType.PAIRWISE && (
                      <>
                        {selectedInstance.expectedResult !== '' && (
                          <Fragment key={`expected-results`}>
                            <p key={'expected-result-title'}>
                              <strong>{'Expected winner: '}</strong>
                            </p>
                            <p key={'expected-result-value'}>{`${toTitleCase(
                              currentTestCase.criteria.predictionField,
                            )} ${selectedInstance.expectedResult}`}</p>
                          </Fragment>
                        )}

                        <p key={'instance-ranking-title'}>
                          <strong>{'Instance ranking: '}</strong>
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 10fr',
                            justifyItems: 'center',
                            alignItems: 'center',
                          }}
                          key={'ranking'}
                        >
                          {Object.keys(selectedInstance.result as PairwiseInstanceResult)
                            .sort(
                              (key1, key2) =>
                                (selectedInstance.result as PairwiseInstanceResult)[key1].ranking -
                                (selectedInstance.result as PairwiseInstanceResult)[key2].ranking,
                            )
                            .map((key, i) => (
                              <Fragment key={`results-${i}`}>
                                <p style={{ justifySelf: 'start' }}>{`- ${
                                  (selectedInstance.result as PairwiseInstanceResult)[key].ranking
                                }${getOrdinalSuffix(
                                  (selectedInstance.result as PairwiseInstanceResult)[key].ranking,
                                )} place`}</p>
                                <ArrowRight style={{ justifySelf: 'start' }} size={16} />
                                <p style={{ justifySelf: 'start' }}>
                                  {` ${toTitleCase(
                                    currentTestCase.criteria.predictionField,
                                  )} ${key} (Winrate: ${toPercentage(
                                    (selectedInstance.result as PairwiseInstanceResult)[key].winrate,
                                  )})`}
                                </p>
                              </Fragment>
                            ))}
                        </div>
                        <p>
                          <strong>{'Positional bias:'}</strong>
                        </p>
                        <p
                          className={cx({
                            [classes.errorText]: positionalBiasDetected,
                          })}
                        >
                          {positionalBiasDetected ? 'Detected' : 'Not detected'}
                        </p>
                        <p key={'instance-per-response-title'}>
                          <strong>{`Per ${currentTestCase.criteria.predictionField.toLocaleLowerCase()} results: `}</strong>
                        </p>
                        <Accordion className={classes.accordionFullWidth}>
                          {Object.entries(selectedInstance.result as PairwiseInstanceResult).map(
                            ([key, responseResults], j) => (
                              <AccordionItem
                                title={`${toTitleCase(currentTestCase.criteria.predictionField)} ${key}`}
                                key={j}
                                open={openedPerReponseResults[j]}
                                onClick={() => {
                                  setOpenedPerReponseResults([
                                    ...openedPerReponseResults.slice(0, j).map(() => false),
                                    !!!openedPerReponseResults[j],
                                    ...openedPerReponseResults.slice(j + 1).map(() => false),
                                  ])
                                }}
                              >
                                <div className={cx(classes.gridTemplate)}>
                                  <p>
                                    <strong>{'Ranking: '}</strong>
                                  </p>
                                  <p>{`${responseResults.ranking}${getOrdinalSuffix(responseResults.ranking)}`}</p>
                                  <p>
                                    <strong>{'Winrate: '}</strong>
                                  </p>
                                  <p>{toPercentage(responseResults.winrate)}</p>
                                  <p>
                                    <strong>{'Contest results: '}</strong>
                                  </p>
                                  <UnorderedList>
                                    {Object.values(responseResults.explanations).map((explanation, i) => (
                                      <ListItem key={i}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                          <div>
                                            <p key={i} className={classes.explanation}>
                                              <strong>{`${
                                                responseResults.contestResults[i] ? 'Won' : 'Lost'
                                              } against ${toTitleCase(currentTestCase.criteria.predictionField)} ${
                                                responseResults.comparedTo[i]
                                              }: `}</strong>
                                            </p>
                                            <div>
                                              <Markdown>{explanation}</Markdown>
                                            </div>
                                            <br />
                                          </div>
                                          {responseResults.positionalBias[i] && (
                                            <Tooltip label={'Positional bias detected'}>
                                              <div className={classes.errorText}>
                                                <Warning />
                                              </div>
                                            </Tooltip>
                                          )}
                                        </div>
                                      </ListItem>
                                    ))}
                                  </UnorderedList>
                                </div>
                              </AccordionItem>
                            ),
                          )}
                        </Accordion>
                      </>
                    )}
                  </>
                </div>
              ) : (
                <p>{'There are no results available.'}</p>
              )}
            </AccordionItem>
            {selectedInstance.metadata && 'synthetic_generation' in selectedInstance.metadata && (
              <AccordionItem title="Synthetic generation metadata" open key={'Synthetic generation metadata'}>
                <p>{'This instance was generated synthetically by an LLM.'}</p>
                <br />
                <div className={cx(classes.gridTemplate)}>
                  {Object.entries(selectedInstance.metadata['synthetic_generation'] as Record<string, any>).map(
                    ([k, v]) => (
                      <>
                        <p>
                          <strong>{`${capitalizeFirstWord(k)}:`}</strong>
                        </p>
                        <p style={{ whiteSpace: 'pre-line' }}>
                          {v !== null ? capitalizeFirstWord(v) : 'Not specified'}
                        </p>
                      </>
                    ),
                  )}
                </div>
              </AccordionItem>
            )}
          </Accordion>
        </Layer>
      </Modal>
    )
  )
}
