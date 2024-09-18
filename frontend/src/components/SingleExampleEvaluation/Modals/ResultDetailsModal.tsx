import cx from 'classnames'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { Layer, Link, ListItem, Modal, UnorderedList } from '@carbon/react'

import { getOrdinalSuffix, toPercentage } from '@utils/utils'

import { PerResponsePairwiseResult, PipelineType, RubricResult } from '../../../types'
import classes from './ResultDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  selectedResultDetails: {
    result: RubricResult | PerResponsePairwiseResult | null
    expectedResult: string
    responseIndex: string
  }
  setSelectedResultDetails: Dispatch<
    SetStateAction<{
      result: RubricResult | PerResponsePairwiseResult | null
      expectedResult: string
      responseIndex: string
    }>
  >
  type: PipelineType
}

export const ResultDetailsModal = ({ open, setOpen, selectedResultDetails, setSelectedResultDetails, type }: Props) => {
  const onClose = () => {
    setOpen(false)
    setSelectedResultDetails({ result: null, expectedResult: '', responseIndex: '' })
  }

  const positionalBiasString = useMemo(() => {
    if (selectedResultDetails.result === null) return null
    let pb: string
    if (type === PipelineType.RUBRIC) {
      pb = `${(selectedResultDetails.result as RubricResult)?.positionalBias}`
    } else {
      pb = `${(selectedResultDetails.result as PerResponsePairwiseResult).positionalBias.some(
        (pBias) => pBias === true,
      )}`
    }
    return pb.charAt(0).toUpperCase() + pb.slice(1) + ' '
  }, [selectedResultDetails, type])

  return (
    selectedResultDetails.result !== null && (
      <Modal
        open={open}
        onRequestClose={onClose}
        passiveModal
        size="sm"
        modalHeading={`Result details: Response ${selectedResultDetails.responseIndex}`}
      >
        <Layer style={{ display: 'flex', flexDirection: 'column' }}>
          {type === PipelineType.RUBRIC && (
            <>
              {selectedResultDetails.expectedResult !== '' && (
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>{'Expected result: '}</strong>
                  {selectedResultDetails.expectedResult}
                </p>
              )}
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{'Result: '}</strong> {(selectedResultDetails.result as RubricResult).option}
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Positional bias:</strong>{' '}
                <span
                  className={cx({ [classes['positional-bias-error']]: selectedResultDetails.result.positionalBias })}
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
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Explanation:</strong> {(selectedResultDetails.result as RubricResult).explanation}
              </p>
              {/* {selectedResultDetails.result.certainty && (
                <p style={{ marginBottom: '0.5rem' }}>
                  {' '}
                  <strong>Certainty:</strong> {toPercentage((selectedResultDetails.result as RubricResult).certainty)}{' '}
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

          {type === PipelineType.PAIRWISE && (
            <>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{'Ranking: '}</strong>
                {`${(selectedResultDetails.result as PerResponsePairwiseResult).ranking + 1}${getOrdinalSuffix(
                  (selectedResultDetails.result as PerResponsePairwiseResult).ranking + 1,
                )}`}
              </p>
              {selectedResultDetails.expectedResult !== '' && (
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>{'Expected ranking: '}</strong>
                  {`${selectedResultDetails.expectedResult}${getOrdinalSuffix(
                    +selectedResultDetails.expectedResult as number,
                  )}`}
                </p>
              )}
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Win rate:</strong>{' '}
                {toPercentage((selectedResultDetails.result as PerResponsePairwiseResult).winrate)}
              </p>
              {/* {selectedResultDetails.result.certainty && (
                <p style={{ marginBottom: '0.5rem' }}>
                  {' '}
                  <strong>Certainty:</strong>{' '}
                  {(selectedResultDetails.result as PerResponsePairwiseResult).certainty
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
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>{'Positional bias: '}</strong>
                <span
                  className={cx({
                    [classes['positional-bias-error']]: (
                      selectedResultDetails.result as PerResponsePairwiseResult
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
              </p>
              <div style={{ marginBottom: '0.5rem' }}>
                <p>
                  <strong>Explanations:</strong>
                </p>

                <UnorderedList>
                  {Object.values((selectedResultDetails.result as PerResponsePairwiseResult).explanations).map(
                    (explanation, i) => (
                      <ListItem key={i}>
                        <>
                          <p key={i} className={classes.explanation}>
                            <strong>
                              {`Against response ${
                                (selectedResultDetails.result as PerResponsePairwiseResult).comparedToIndexes[i] + 1
                              }: `}
                            </strong>
                            {explanation}
                          </p>
                          <br />
                        </>
                      </ListItem>
                    ),
                  )}
                </UnorderedList>
              </div>
            </>
          )}
        </Layer>
      </Modal>
    )
  )
}
