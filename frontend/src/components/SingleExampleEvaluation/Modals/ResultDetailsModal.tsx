import cx from 'classnames'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { Layer, Link, Modal } from '@carbon/react'

import { isInstanceOfPairwiseResult } from '@utils/utils'

import { PairwiseResult, PipelineType, RubricResult } from '../../../utils/types'
import classes from './ResultDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  selectedResultDetails: { result: RubricResult | PairwiseResult | null; expectedResult: string }
  setSelectedResultDetails: Dispatch<
    SetStateAction<{ result: RubricResult | PairwiseResult | null; expectedResult: string }>
  >
  type: PipelineType
}

export const ResultDetailsModal = ({ open, setOpen, selectedResultDetails, setSelectedResultDetails, type }: Props) => {
  const onClose = () => {
    setOpen(false)
    setSelectedResultDetails({ result: null, expectedResult: '' })
  }

  const positionalBiasString = useMemo(() => {
    const pb = `${selectedResultDetails.result?.positionalBias}`
    return pb.charAt(0).toUpperCase() + pb.slice(1) + ' '
  }, [selectedResultDetails.result?.positionalBias])

  return (
    selectedResultDetails.result !== null && (
      <Modal open={open} onRequestClose={onClose} passiveModal size="sm" modalHeading="Result details">
        <Layer style={{ display: 'flex', flexDirection: 'column' }}>
          {type === PipelineType.RUBRIC ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{'Result: '}</strong> {(selectedResultDetails.result as RubricResult).option}
            </p>
          ) : null}

          {type === PipelineType.RUBRIC && selectedResultDetails.expectedResult !== '' ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{'Expected result: '}</strong>
              {selectedResultDetails.expectedResult}
            </p>
          ) : null}

          {type === PipelineType.PAIRWISE ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{'Winner: '}</strong>
              {`Response ${+(selectedResultDetails.result as PairwiseResult).winnerIndex + 1}`}
            </p>
          ) : null}

          {type === PipelineType.PAIRWISE ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{'Expected winner: '}</strong>
              {`Response ${
                selectedResultDetails.expectedResult === 'Winner'
                  ? +(selectedResultDetails.result as PairwiseResult).winnerIndex + 1
                  : +(selectedResultDetails.result as PairwiseResult).winnerIndex === 1
                  ? 1
                  : 2
              }`}
            </p>
          ) : null}

          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Explanation:</strong> {selectedResultDetails.result.explanation}
          </p>
          {selectedResultDetails.result.certainty && (
            <p style={{ marginBottom: '0.5rem' }}>
              {' '}
              <strong>Certainty:</strong> {(selectedResultDetails.result.certainty * 100).toFixed(0) + '%'}{' '}
              <Link
                className={classes['positional-bias-link']}
                rel="noopener noreferrer"
                target="_blank"
                href={'/documentation/#certainty'}
              >
                {'(What is this?)'}
              </Link>
            </p>
          )}

          <p>
            <strong>Positional bias:</strong>{' '}
            <span className={cx({ [classes['positional-bias-error']]: selectedResultDetails.result.positionalBias })}>
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
        </Layer>
      </Modal>
    )
  )
}
