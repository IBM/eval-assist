import cx from 'classnames'
import { capitalizeFirstWord, getEmptyUseCase, returnByPipelineType } from 'src/utils'

import { Dispatch, SetStateAction, useState } from 'react'

import { Layer, Modal, Select, SelectItem } from '@carbon/react'
import { Warning } from '@carbon/react/icons'

import { Criteria, CriteriaWithOptions, EvaluationType, UseCase } from '../../../types'
import { PipelineOptionCard } from '../Card/PipelineOptionCard'
import { useCriteriasContext } from '../Providers/CriteriasProvider'
import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'
import { useToastContext } from '../Providers/ToastProvider'
import classes from './NewUseCaseModal.module.scss'

interface Props {
  open: boolean
  changesDetected: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  updateURLFromUseCase: (useCaseSelected: { useCase: UseCase; subCatalogName: string | null }) => void
}

export const NewUseCaseModal = ({ open, changesDetected, setOpen, updateURLFromUseCase }: Props) => {
  const [selectedType, setSelectedType] = useState<EvaluationType | null>(null)
  const [selectedCriteria, setSelectedCriteria] = useState<Criteria | CriteriaWithOptions | null>(null)

  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const { addToast } = useToastContext()

  const { directCriterias, pairwiseCriterias, getEmptyUseCaseWithCriteria } = useCriteriasContext()

  const onSubmit = async () => {
    if (rubricPipelines !== null && pairwisePipelines !== null && selectedType !== null) {
      let toCreateTestCase: UseCase
      if (selectedCriteria !== null) {
        toCreateTestCase = getEmptyUseCaseWithCriteria(selectedCriteria.name, selectedType)
      } else {
        toCreateTestCase = getEmptyUseCase(selectedType)
      }
      updateURLFromUseCase({
        useCase: {
          ...toCreateTestCase,
          evaluator: selectedType === EvaluationType.DIRECT ? rubricPipelines[0] : pairwisePipelines[0],
        },
        subCatalogName: null,
      })
    } else {
      updateURLFromUseCase({ useCase: getEmptyUseCase(selectedType as EvaluationType), subCatalogName: null })
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
            setSelectedType={setSelectedType}
          />
          <PipelineOptionCard
            type={EvaluationType.PAIRWISE}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
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
            onChange={(e) => {
              const selected = returnByPipelineType<CriteriaWithOptions[], Criteria[]>(
                selectedType,
                directCriterias!,
                pairwiseCriterias!,
              ).find((criteria) => criteria.name == e.target.value)
              if (selected) {
                setSelectedCriteria(selected)
              }
            }}
          >
            <SelectItem key={'Empty'} text={'No criteria selected'} value={''} />
            {returnByPipelineType<CriteriaWithOptions[], Criteria[]>(
              selectedType,
              directCriterias!,
              pairwiseCriterias!,
            ).map((c, i) => (
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
