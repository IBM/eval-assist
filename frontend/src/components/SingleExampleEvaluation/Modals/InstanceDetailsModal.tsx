import cx from 'classnames'
import { getOrdinalSuffix, toPercentage, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { Layer, Link, ListItem, Modal, UnorderedList } from '@carbon/react'

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
      <Modal open={open} onRequestClose={onClose} passiveModal size="sm" modalHeading={`Instance details`}>
        <Layer className={cx(classes.gridTemplate)}>
          {selectedInstance.contextVariables.map((contectVariable, i) => (
            <>
              <p key={`${i}_0`}>
                <strong>{`${toTitleCase(contectVariable.name)}:`}</strong>
              </p>
              <p key={`${i}_1`}>{contectVariable.value}</p>
            </>
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
              <>
                <p>
                  <strong>{`${toTitleCase(responseVariableName)} ${i + 1}`}</strong>
                </p>
                <p>{response}</p>
              </>
            ))}

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

                  <p>
                    <strong>Explanation:</strong>
                  </p>
                  <p>{(selectedInstance.result as DirectInstanceResult).summary}</p>
                </>
              )}

              {type === EvaluationType.PAIRWISE && (
                <>
                  {selectedInstance.expectedResult !== '' && (
                    <>
                      <p>
                        <strong>{'Expected result: '}</strong>
                      </p>
                      <p>{`${toTitleCase(responseVariableName)} ${selectedInstance.expectedResult}`}</p>
                    </>
                  )}

                  <p>
                    <strong>{'Ranking: '}</strong>
                  </p>
                  <UnorderedList>
                    {Object.keys(selectedInstance.result as PairwiseInstanceResult)
                      .sort(
                        (key1, key2) =>
                          (selectedInstance.result as PairwiseInstanceResult)[key1].ranking -
                          (selectedInstance.result as PairwiseInstanceResult)[key2].ranking,
                      )
                      .map((key, i) => (
                        <ListItem key={i}>
                          <p>
                            {`${(selectedInstance.result as PairwiseInstanceResult)[key].ranking}${getOrdinalSuffix(
                              (selectedInstance.result as PairwiseInstanceResult)[key].ranking,
                            )}: ${toTitleCase(responseVariableName)} ${i + 1} (Winrate: ${toPercentage(
                              (selectedInstance.result as PairwiseInstanceResult)[key].winrate,
                            )})`}
                          </p>
                        </ListItem>
                      ))}
                  </UnorderedList>
                </>
              )}
            </>
          )}
        </Layer>
      </Modal>
    )
  )
}
