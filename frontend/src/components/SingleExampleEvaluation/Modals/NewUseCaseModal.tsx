import cx from 'classnames'
import { capitalizeFirstWord, getEmptyTestCase, returnByPipelineType } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'

import { Layer, Modal, Select, SelectItem } from '@carbon/react'
import { Warning } from '@carbon/react/icons'

import { useCriteriasContext } from '@providers/CriteriasProvider'
import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { useToastContext } from '@providers/ToastProvider'

import { Criteria, CriteriaWithOptions, EvaluationType, TestCase } from '../../../types'
import { PipelineOptionCard } from '../Card/PipelineOptionCard'
import classes from './NewUseCaseModal.module.scss'

interface Props {
  open: boolean
  changesDetected: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  updateURLFromUseCase: (useCaseSelected: { useCase: TestCase; subCatalogName: string | null }) => void
}

export const NewUseCaseModal = ({ open, changesDetected, setOpen, updateURLFromUseCase }: Props) => {
  const [selectedType, setSelectedType] = useState<EvaluationType | null>(null)
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | CriteriaWithOptions | null>(null)

  const { directEvaluators, pairwiseEvaluators } = useEvaluatorOptionsContext()

  const { addToast } = useToastContext()

  const { directCriterias, pairwiseCriterias, getEmptyUseCaseWithCriteria } = useCriteriasContext()

  const onSubmit = async () => {
    if (directEvaluators !== null && pairwiseEvaluators !== null && selectedType !== null) {
      let toCreateTestCase: TestCase
      if (selectedCriteria !== null) {
        toCreateTestCase = getEmptyUseCaseWithCriteria(selectedCriteria.name, selectedType)
      } else {
        toCreateTestCase = getEmptyTestCase(selectedType)
      }
      updateURLFromUseCase({
        useCase: {
          ...toCreateTestCase,
          evaluator: selectedType === EvaluationType.DIRECT ? directEvaluators[0] : pairwiseEvaluators[0],
        },
        subCatalogName: null,
      })
    } else {
      updateURLFromUseCase({ useCase: getEmptyTestCase(selectedType as EvaluationType), subCatalogName: null })
      addToast({
        kind: 'info',
        title: 'Evaluator options are not yet available',
        subtitle: 'Choose an option once they are ready',
        timeout: 5000,
      })
    }
    resetStatus()
  }

  const resetStatus = () => {
    setOpen(false)
    setSelectedType(null)
  }

  const sortedCriterias = useMemo(() => {
    if (selectedType !== null) {
      return returnByPipelineType<CriteriaWithOptions[], Criteria[]>(
        selectedType,
        directCriterias!,
        pairwiseCriterias!,
      ).sort((a, b) => a.name.localeCompare(b.name))
    }
    return []
  }, [directCriterias, pairwiseCriterias, selectedType])

  const onSelectedCriteriaChange = useCallback(
    (e: { target: { value: string } }) => {
      if (selectedType === null) return
      if (selectedCriteria === null) setSelectedCriteria(null)
      const selected = returnByPipelineType<CriteriaWithOptions[], Criteria[]>(
        selectedType,
        directCriterias!,
        pairwiseCriterias!,
      ).find((criteria) => criteria.name == e.target.value)
      if (selected) {
        setSelectedCriteria(selected)
      }
    },
    [directCriterias, pairwiseCriterias, selectedCriteria, selectedType],
  )

  const onSelectedTypeChange = useCallback((selectedType: EvaluationType | null) => {
    setSelectedCriteria(null)
    setSelectedType(selectedType)
  }, [])

  return (
    <Modal
      open={open}
      onRequestClose={resetStatus}
      modalHeading={`Create a new Test Case`}
      primaryButtonText="Confirm"
      secondaryButtonText="Cancel"
      onRequestSubmit={onSubmit}
      shouldSubmitOnEnter
      primaryButtonDisabled={selectedType === null}
      className={cx(classes['bottom-padding'], classes.root)}
    >
      <Layer type={'outline'}>
        <p className={'cds--label'}>Select an Evaluation Method</p>
        <div className={classes.cards}>
          <PipelineOptionCard
            type={EvaluationType.DIRECT}
            selectedType={selectedType}
            onClick={() => onSelectedTypeChange(EvaluationType.DIRECT)}
          />
          <PipelineOptionCard
            type={EvaluationType.PAIRWISE}
            selectedType={selectedType}
            onClick={() => onSelectedTypeChange(EvaluationType.PAIRWISE)}
          />
        </div>
        {selectedType !== null && (
          <Select
            id={'criteria selector'}
            labelText={
              <span>
                {`Select a predefined ${returnByPipelineType(selectedType, 'direct', 'pairwise')} criteria `}
                <em>{'(Optional)'}</em>
              </span>
            }
            onChange={onSelectedCriteriaChange}
            value={selectedCriteria?.name || ''}
          >
            <SelectItem key={'Empty'} text={''} value={''} />
            {sortedCriterias.map((c, i) => (
              <SelectItem key={i} text={capitalizeFirstWord(c.name)} value={c.name} />
            ))}
          </Select>
        )}
        {changesDetected && (
          <div className={classes['danger-text']}>
            <Warning />

            {`This action will replace your ongoing work with a blank new test case.`}
          </div>
        )}
      </Layer>
    </Modal>
  )
}
