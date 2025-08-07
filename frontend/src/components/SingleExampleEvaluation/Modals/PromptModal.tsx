import { toSnakeCase } from 'src/utils'

import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Loading, Modal, Select, SelectItem } from '@carbon/react'

import { HighlightTextArea } from '@components/HighlightTextArea'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useCriteriasContext } from '@providers/CriteriaProvider'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useToastContext } from '@providers/ToastProvider'
import { DirectInstance, EvaluationType } from '@types'

import classes from './PromptModal.module.scss'

interface Props {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export const PromptModal = ({ open, setOpen }: Props) => {
  const { currentTestCase } = useCurrentTestCase()
  const [prompts, setPrompts] = useState<string[] | null>(null)
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0)
  const { getCriteria } = useCriteriasContext()

  const { post } = useFetchUtils()
  const { addToast } = useToastContext()

  useEffect(() => {
    const getPrompts = async () => {
      if (currentTestCase !== null && open) {
        const parsedCriteria = { ...currentTestCase.criteria }
        // check if criteria description changed and criteria name didn't
        const harmsAndRiskCriteria = getCriteria(
          `${toSnakeCase(currentTestCase.criteria.name)}>${toSnakeCase(currentTestCase.criteria.predictionField)}`,
          EvaluationType.DIRECT,
        )
        if (
          harmsAndRiskCriteria !== null &&
          harmsAndRiskCriteria.description !== currentTestCase.criteria.description
        ) {
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
          instances: currentTestCase.instances.map((instance) => ({
            context_variables: instance.contextVariables.reduce(
              (acc, item, index) => ({ ...acc, [item.name]: item.value }),
              {},
            ),
            prediction: (instance as DirectInstance).response,
          })),
          evaluator_name: currentTestCase.evaluator?.name,
          provider: currentTestCase.evaluator?.provider,
          criteria: parsedCriteria,
          type: currentTestCase.type,
          llm_provider_credentials: {},
        }

        const prompts = await (await post('prompt/', body)).json()
        setPrompts(prompts)
      }
    }
    getPrompts()
  }, [addToast, currentTestCase, getCriteria, open, post])

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
        currentTestCase !== null &&
        (currentTestCase.instances as DirectInstance[]).map((instance) => instance.response).length > 1
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
