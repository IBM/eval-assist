import { toSnakeCase } from 'src/utils'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Loading, Modal, Select, SelectItem } from '@carbon/react'

import { HighlightTextArea } from '@components/HighlightTextArea'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { DirectInstance, EvaluationType, ModelProviderCredentials, ModelProviderType, UseCase } from '@types'

import { useCriteriasContext } from '../Providers/CriteriasProvider'
import { useToastContext } from '../Providers/ToastProvider'
import classes from './PromptModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentUseCase: UseCase | null
  modelProviderCredentials: ModelProviderCredentials
}

export const PromptModal = ({ open, setOpen, currentUseCase, modelProviderCredentials }: Props) => {
  const [prompts, setPrompts] = useState<string[] | null>(null)
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0)
  const { getCriteria } = useCriteriasContext()

  const { post } = useFetchUtils()
  const { addToast } = useToastContext()

  useEffect(() => {
    const getPrompts = async () => {
      if (currentUseCase !== null && open) {
        const parsedCriteria = { ...currentUseCase.criteria }
        // check if criteria description changed and criteria name didn't
        const harmsAndRiskCriteria = getCriteria(
          `${toSnakeCase(currentUseCase.criteria.name)}>${toSnakeCase(currentUseCase.responseVariableName)}`,
          EvaluationType.DIRECT,
        )
        if (harmsAndRiskCriteria !== null && harmsAndRiskCriteria.description !== currentUseCase.criteria.description) {
          // the tokenizer of granite guardian will complain if we send a predefined criteria name
          // with a custom description.
          addToast({
            kind: 'error',
            title: 'That risk already exist',
            subtitle: "Can't change the definition of an existing risk",
            timeout: 5000,
          })
          return
        }

        let body: any = {
          instances: currentUseCase.instances.map((instance) => ({
            context_variables: instance.contextVariables.reduce(
              (acc, item, index) => ({ ...acc, [item.name]: item.value }),
              {},
            ),
            prediction: (instance as DirectInstance).response,
            prediction_variable_name: currentUseCase.responseVariableName,
          })),
          evaluator_name: currentUseCase.evaluator?.name,
          provider: currentUseCase.evaluator?.provider,
          criteria: parsedCriteria,
          type: currentUseCase.type,
          response_variable_name: currentUseCase.responseVariableName,
          llm_provider_credentials: {},
        }

        const prompts = await (await post('prompt/', body)).json()
        setPrompts(prompts)
      }
    }
    getPrompts()
  }, [addToast, currentUseCase, getCriteria, modelProviderCredentials, open, post])

  useEffect(() => {
    if (open) {
      setPrompts(null)
    }
  }, [open])

  const onClose = () => {
    setOpen(false)
  }

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      passiveModal
      size="sm"
      modalHeading={
        currentUseCase !== null &&
        (currentUseCase.instances as DirectInstance[]).map((instance) => instance.response).length > 1
          ? 'Prompts'
          : 'Prompt'
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {prompts === null ? (
          <div className={classes.loadingRoot}>
            <span>{'Loading'}</span>
            <Loading withOverlay={false} small />
          </div>
        ) : (
          <div className={classes.content}>
            {prompts !== null && prompts?.length > 1 && (
              <Select
                id="prompt-select"
                labelText="Prompts"
                value={selectedPromptIndex.toString()}
                onChange={(e) => {
                  setSelectedPromptIndex(parseInt(e.target.value))
                }}
                size="sm"
                className={classes.selectReadOnly}
                // readOnly={isRisksAndHarms}
              >
                {prompts.map((p, i) => (
                  <SelectItem value={i} text={`Prompt ${i + 1}`} key={i} />
                ))}
              </Select>
            )}
            <HighlightTextArea
              value={prompts[selectedPromptIndex]}
              toHighlightWords={{
                contextVariables: [
                  '<start_of_turn>',
                  '<end_of_turn>',
                  '<|end_of_text|>',
                  '<|start_of_role|>',
                  '<|end_of_role|>',
                  '<start_of_risk_definition>',
                  '<end_of_risk_definition>',
                ],
                responseVariableName: '',
              }}
              isTextArea={true}
              editorId={'prompt'}
              onValueChange={function (value: string): void {
                throw new Error('Function not implemented.')
              }}
              id={''}
              labelText={undefined}
              growToContent={true}
              editable={false}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
