import cx from 'classnames'
import { getOrdinalSuffix, toPercentage, toTitleCase } from 'src/utils'

import { Dispatch, Fragment, SetStateAction, useMemo } from 'react'

import { Accordion, AccordionItem, Layer, Link, ListItem, Modal, UnorderedList } from '@carbon/react'
import { ArrowRight } from '@carbon/react/icons'

import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
  PerResponsePairwiseResult,
} from '../../../types'
import classes from './InstanceDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  selectedInstance: Instance | null
  setSelectedInstance: Dispatch<SetStateAction<Instance | null>>
  type: EvaluationType
  responseVariableName: string
}

export const InstanceDetailsModal = ({
  open,
  setOpen,
  selectedInstance,
  setSelectedInstance,
  type,
  responseVariableName,
}: Props) => {
  const onClose = () => {
    setOpen(false)
    setSelectedInstance(null)
  }

  // const positionalBiasString = useMemo(() => {
  //   if (selectedInstance === null) return null

  //   let pb: string
  //   if (type === EvaluationType.DIRECT) {
  //     pb = `${(selectedInstance.result as DirectInstanceResult)?.positionalBias}`
  //   } else {
  //     pb = `${(selectedInstance.result as PerResponsePairwiseResult).positionalBias.some((pBias) => pBias === true)}`
  //   }
  //   pb = pb.charAt(0).toUpperCase() + pb.slice(1) + ' '
  //   if (type === EvaluationType.DIRECT && (selectedInstance.result as DirectInstanceResult)?.positionalBias) {
  //     pb += `/ '${(selectedInstance.result as DirectInstanceResult).positionalBiasOption}' was selected `
  //   }
  //   return pb
  // }, [selectedInstance, type])
  return (
    selectedInstance !== null && (
      <Modal open={open} onRequestClose={onClose} passiveModal size="lg" modalHeading={`Instance details`}>
        <Layer>
          <Accordion>
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
                {type === EvaluationType.DIRECT && (
                  <>
                    <p>
                      <strong>{toTitleCase(responseVariableName)}</strong>
                    </p>
                    <p>{(selectedInstance as DirectInstance).response}</p>
                  </>
                )}

                {type === EvaluationType.PAIRWISE &&
                  (selectedInstance as PairwiseInstance).responses.map((response, i) => (
                    <Fragment key={`response-${i}`}>
                      <p>
                        <strong>{`${toTitleCase(responseVariableName)} ${i + 1}`}</strong>
                      </p>
                      <p>{response}</p>
                    </Fragment>
                  ))}
              </div>
            </AccordionItem>
            <AccordionItem title="Results" open key={'results'}>
              {selectedInstance.result ? (
                <div className={cx(classes.gridTemplate)}>
                  <>
                    {type === EvaluationType.DIRECT && (
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
                        <p>{(selectedInstance.result as DirectInstanceResult).explanation}</p>
                        {(selectedInstance.result as DirectInstanceResult).positionalBias.detected && (
                          <>
                            <p>
                              <strong>{'Positional bias result: '}</strong>
                            </p>
                            <p>{(selectedInstance.result as DirectInstanceResult).positionalBias.option}</p>

                            <p>
                              <strong>{'Positional bias explanation:'}</strong>
                            </p>
                            <p>{(selectedInstance.result as DirectInstanceResult).positionalBias.explanation}</p>
                          </>
                        )}
                      </>
                    )}

                    {type === EvaluationType.PAIRWISE && (
                      <>
                        {selectedInstance.expectedResult !== '' && (
                          <Fragment key={`expected-results`}>
                            <p key={'expected-result-title'}>
                              <strong>{'Expected result: '}</strong>
                            </p>
                            <p key={'expected-result-value'}>{`${toTitleCase(responseVariableName)} ${
                              selectedInstance.expectedResult
                            }`}</p>
                          </Fragment>
                        )}

                        <p key={'instance-ranking-title'}>
                          <strong>{'Instance ranking: '}</strong>
                        </p>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 10fr',
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
                                <p key={`ranking-rank-${i}`}>{`- ${
                                  (selectedInstance.result as PairwiseInstanceResult)[key].ranking
                                }${getOrdinalSuffix(
                                  (selectedInstance.result as PairwiseInstanceResult)[key].ranking,
                                )}`}</p>
                                <ArrowRight size={16} key={`ranking-arrow-${i}`} />
                                <p style={{ justifySelf: 'start' }} key={`ranking-response-${i}`}>
                                  {` ${toTitleCase(responseVariableName)} ${key} (Winrate: ${toPercentage(
                                    (selectedInstance.result as PairwiseInstanceResult)[key].winrate,
                                  )})`}
                                </p>
                              </Fragment>
                            ))}
                        </div>
                      </>
                    )}
                  </>
                </div>
              ) : (
                <p>{'There are no available results.'}</p>
              )}
            </AccordionItem>
          </Accordion>
        </Layer>
      </Modal>
    )
  )
}
