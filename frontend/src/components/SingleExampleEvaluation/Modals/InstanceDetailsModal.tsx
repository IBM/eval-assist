import cx from 'classnames'
import { getOrdinalSuffix, toPercentage, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { Layer, Link, ListItem, Modal, UnorderedList } from '@carbon/react'

import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Instance,
  PairwiseInstanceResult,
  PerResponsePairwiseResult,
} from '../../../types'
import classes from './ResultDetailsModal.module.scss'

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
      <Modal open={open} onRequestClose={onClose} passiveModal size="sm" modalHeading={`Instance details`}>
        <Layer style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem' }}>
          {selectedInstance.contextVariables.map((contectVariable, i) => (
            <>
              <p key={`${i}_0`}>
                <strong>{`${toTitleCase(contectVariable.name)}:`}</strong>
              </p>
              <p key={`${i}_1`}>{contectVariable.value}</p>
            </>
          ))}
          <p>
            <strong>{toTitleCase(responseVariableName)}</strong>
          </p>
          <p>{(selectedInstance as DirectInstance).response}</p>

          {selectedInstance.result && (
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
                  {/* <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Positional bias:</strong>{' '}
                    <span
                      className={cx({
                        [classes['positional-bias-error']]: selectedInstance.result.positionalBias,
                      })}
                    >
                      {positionalBiasString}
                    </span>
                    <Link
                      className={classes['positional-bias-link']}
                      rel="noopener noreferrer"
                      target="_blank"
                      href={'/documentation/#positional-bias'}
                    >
                      {'(What is this?)'}
                    </Link>
                  </p> */}
                  <p>
                    <strong>Explanation:</strong>
                  </p>
                  <p>{(selectedInstance.result as DirectInstanceResult).summary}</p>
                  {/* {selectedInstance.result.certainty && (
                <p style={{ marginBottom: '0.5rem' }}>
                  {' '}
                  <strong>Certainty:</strong> {toPercentage((selectedInstance.result as RubricResult).certainty)}{' '}
                  <Link
                    className={classes['positional-bias-link']}
                    rel="noopener noreferrer"
                    target="_blank"
                    href={'/documentation/#certainty'}
                  >
                    {'(What is this?)'}
                  </Link>
                </p>
              )} */}
                </>
              )}

              {type === EvaluationType.PAIRWISE && (
                <>
                  {/* <p style={{ marginBottom: '0.5rem' }}>
                    <strong>{'Ranking: '}</strong>
                    {`${(selectedInstance.result as PairwiseInstanceResult).ranking}${getOrdinalSuffix(
                      (selectedInstance.result as PairwiseInstanceResult).ranking,
                    )}`}
                  </p> */}
                  {selectedInstance.expectedResult !== '' && (
                    <p>
                      <strong>{'Expected ranking: '}</strong>
                      {`${selectedInstance.expectedResult}${getOrdinalSuffix(
                        +selectedInstance.expectedResult as number,
                      )}`}
                    </p>
                  )}
                  {/* <p style={{ marginBottom: '0.5rem' }}>
                    <strong>Win rate:</strong>{' '}
                    {toPercentage((selectedInstance.result as PerResponsePairwiseResult).winrate)}
                  </p> */}
                  {/* {selectedInstance.result.certainty && (
                <p style={{ marginBottom: '0.5rem' }}>
                  {' '}
                  <strong>Certainty:</strong>{' '}
                  {(selectedInstance.result as PerResponsePairwiseResult).certainty
                    .map((c) => toPercentage(c))
                    .join(', ')}{' '}
                  <Link
                    className={classes['positional-bias-link']}
                    rel="noopener noreferrer"
                    target="_blank"
                    href={'/documentation/#certainty'}
                  >
                    {'(What is this?)'}
                  </Link>
                </p>
              )} */}
                  {/* <p style={{ marginBottom: '0.5rem' }}>
                    <strong>{'Positional bias: '}</strong>
                    <span
                      className={cx({
                        [classes['positional-bias-error']]: (
                          selectedInstance.result as PerResponsePairwiseResult
                        ).positionalBias.some((pBias) => pBias === true),
                      })}
                    >
                      {positionalBiasString}
                    </span>
                    <Link
                      className={classes['positional-bias-link']}
                      rel="noopener noreferrer"
                      target="_blank"
                      href={'/documentation/#positional-bias'}
                    >
                      {'(What is this?)'}
                    </Link>
                  </p> */}
                  <div>
                    <p>
                      <strong>Explanations:</strong>
                    </p>

                    {/* <UnorderedList>
                      {Object.values((selectedInstance.result as PerResponsePairwiseResult).summaries).map(
                        (explanation, i) => (
                          <ListItem key={i}>
                            <>
                              <p key={i} className={classes.explanation}>
                                <strong>
                                  {`Against response ${
                                    (selectedInstance.result as PerResponsePairwiseResult).comparedTo[i]
                                  }: `}
                                </strong>
                                {explanation}
                              </p>
                              <br />
                            </>
                          </ListItem>
                        ),
                      )}
                    </UnorderedList> */}
                  </div>
                </>
              )}
            </>
          )}
        </Layer>
      </Modal>
    )
  )
}
