import cx from 'classnames'
import { useMediaQuery } from 'usehooks-ts'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import { Button, Layer, Link, Modal } from '@carbon/react'
import { Label } from '@carbon/react/icons'

import { isInstanceOfPairwiseResult } from '@utils/utils'

import { PairwiseResult, PipelineType, RubricResult } from '../types'
import classes from './ResultDetailsModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  selectedResultDetails: RubricResult | PairwiseResult | null
  setSelectedResultDetails: Dispatch<SetStateAction<RubricResult | PairwiseResult | null>>
}

export const ResultDetailsModal = ({ open, setOpen, selectedResultDetails, setSelectedResultDetails }: Props) => {
  const onClose = () => {
    setOpen(false)
    setSelectedResultDetails(null)
  }

  const positionalBiasString = useMemo(() => {
    const pb = `${selectedResultDetails?.positionalBias}`
    return pb.charAt(0).toUpperCase() + pb.slice(1) + ' '
  }, [selectedResultDetails?.positionalBias])

  const pipelineType = useMemo(
    () => (isInstanceOfPairwiseResult(selectedResultDetails) ? PipelineType.PAIRWISE : PipelineType.RUBRIC),
    [selectedResultDetails],
  )

  return (
    selectedResultDetails !== null && (
      <Modal open={open} onRequestClose={onClose} passiveModal size="sm" modalHeading="Result details">
        <Layer style={{ display: 'flex', flexDirection: 'column' }}>
          {pipelineType === PipelineType.RUBRIC ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{(selectedResultDetails as RubricResult).name + ':'}</strong>{' '}
              {(selectedResultDetails as RubricResult).option}
            </p>
          ) : null}

          {pipelineType === PipelineType.PAIRWISE ? (
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>{'Winner: '}</strong>
              {`Response ${+(selectedResultDetails as PairwiseResult).winnerIndex + 1}`}
            </p>
          ) : null}

          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Evaluation explanation:</strong> {selectedResultDetails.explanation}
          </p>
          <p>
            <strong>Positional bias:</strong>{' '}
            <span className={cx({ [classes['positional-bias-error']]: selectedResultDetails.positionalBias })}>
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
