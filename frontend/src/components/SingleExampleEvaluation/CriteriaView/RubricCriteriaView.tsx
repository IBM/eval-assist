import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from 'react'

import {
  Accordion,
  AccordionItem,
  Button,
  IconButton,
  Layer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  TextInput,
} from '@carbon/react'
import { Add, Edit, Save, TrashCan } from '@carbon/react/icons'

import { HighlightTextArea } from '@components/HighlightTextArea'
import { DirectAssessmentCriteria } from '@types'
import { isInstanceOfRubricCriteria } from '@utils/utils'

import { JSONTextArea } from '../JSONTextArea'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import classes from '../SingleExampleEvaluation.module.scss'
import customClasses from './index.module.scss'

interface EvaluationCriteriaProps {
  rubricCriteria: DirectAssessmentCriteria
  setCriteria: Dispatch<SetStateAction<DirectAssessmentCriteria>>
  selectedTabIndex: number
  setSelectedTabIndex: Dispatch<SetStateAction<number>>
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
  style?: CSSProperties
  className?: string
}

export const RubricCriteriaView = ({
  rubricCriteria,
  setCriteria,
  selectedTabIndex,
  setSelectedTabIndex,
  toHighlightWords,
  style,
}: EvaluationCriteriaProps) => {
  const [isEditingCriteriaTitle, setIsEditingCriteriaTitle] = useState(rubricCriteria.name === '')
  const [rawJSONCriteria, setRawJSONCriteria] = useState('')
  const { isRisksAndHarms } = useURLInfoContext()
  const isValidRawJSONCriteria = (jsonCriteria: string) => {
    try {
      const rawJSONCriteriaObj = JSON.parse(jsonCriteria)
      return isInstanceOfRubricCriteria(rawJSONCriteriaObj)
    } catch {
      return false
    }
  }

  const onSelectedIndexChange = (e: { selectedIndex: number }) => {
    setSelectedTabIndex(e.selectedIndex)

    if (e.selectedIndex === 0 && selectedTabIndex === 1) {
      if (isValidRawJSONCriteria(rawJSONCriteria)) {
        const newRawJSONCriteriaObj = JSON.parse(rawJSONCriteria)
        setCriteria(newRawJSONCriteriaObj)
      }
    } else if (e.selectedIndex === 1 && selectedTabIndex === 0) {
      setRawJSONCriteria(JSON.stringify(rubricCriteria, null, 4))
    }
  }

  return (
    <div style={style} key={'rubric-criteria'}>
      <Accordion>
        <AccordionItem title={<h5>Evaluation Criteria</h5>} className={classes['accordion-wrapper']} open>
          <div>
            <Tabs selectedIndex={selectedTabIndex} onChange={onSelectedIndexChange}>
              <TabList aria-label="List of tabs" contained>
                <Tab>Form</Tab>
                <Tab>JSON</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Layer>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: '14rem',
                          }}
                        >
                          {isEditingCriteriaTitle ? (
                            <TextInput
                              labelText=""
                              value={rubricCriteria.name}
                              onChange={(e) => setCriteria({ ...rubricCriteria, name: e.target.value })}
                              readOnly={!isEditingCriteriaTitle}
                              id="text-input-criteria-title"
                              placeholder="Criteria title"
                              style={{ width: '95%' }}
                            />
                          ) : (
                            <h4 style={{ width: '95%' }}>{rubricCriteria.name}</h4>
                          )}
                          {isEditingCriteriaTitle ? (
                            <IconButton onClick={() => setIsEditingCriteriaTitle(false)} kind="ghost" label={'Save'}>
                              <Save />
                            </IconButton>
                          ) : (
                            <IconButton onClick={() => setIsEditingCriteriaTitle(true)} kind="ghost" label={'Edit'}>
                              <Edit />
                            </IconButton>
                          )}
                        </div>
                      </div>
                      <HighlightTextArea
                        id="criteria-description-rubric"
                        key="criteria-description-rubric"
                        labelText="Criteria"
                        toHighlightWords={toHighlightWords}
                        value={rubricCriteria.description}
                        className={customClasses.criteriaText}
                        isTextInput={false}
                        isTextArea={true}
                        editorId={'criteria-description-rubric'}
                        style={{ marginBottom: '1rem' }}
                        placeholder="Describe your evaluation criteria as a question e.g Is the response gramatically correct?"
                        onValueChange={(value: string) =>
                          setCriteria({
                            ...rubricCriteria,
                            description: value,
                          })
                        }
                        // readOnly={isRisksAndHarms}
                      />
                      {rubricCriteria.options.map((scale, i) => (
                        <div key={i} className={customClasses.optionsGrid}>
                          <TextInput
                            labelText="Option"
                            value={scale.name}
                            placeholder="Answer"
                            onChange={(e) =>
                              setCriteria({
                                ...rubricCriteria,
                                options: [
                                  ...rubricCriteria.options.slice(0, i),
                                  { name: e.target.value, description: rubricCriteria.options[i].description },
                                  ...rubricCriteria.options.slice(i + 1),
                                ],
                              })
                            }
                            id={`criteria-option-value-${i}`}
                            key={`criteria-option-value-${i}`}
                            // readOnly={isRisksAndHarms}
                          />
                          <HighlightTextArea
                            id={`criteria-option-description-${i}`}
                            key={`criteria-option-description-${i}`}
                            labelText="Description (optional)"
                            toHighlightWords={toHighlightWords}
                            value={scale.description}
                            className={customClasses.criteriaText}
                            isTextInput={true}
                            isTextArea={false}
                            editorId={`criteria-option-value-${i}`}
                            onValueChange={(value: string) =>
                              setCriteria({
                                ...rubricCriteria,
                                options: [
                                  ...rubricCriteria.options.slice(0, i),
                                  { name: scale.name, description: value },
                                  ...rubricCriteria.options.slice(i + 1),
                                ],
                              })
                            }
                            // readOnly={isRisksAndHarms}
                          />
                          {rubricCriteria.options.length > 2 && (
                            <IconButton
                              label={'Remove'}
                              size="sm"
                              kind="ghost"
                              style={{ marginTop: '24px' }}
                              onClick={() =>
                                setCriteria({
                                  ...rubricCriteria,
                                  options: rubricCriteria.options.filter((s, j) => j !== i),
                                })
                              }
                              id={`criteria-option-delete-${i}`}
                              key={`criteria-option-delete-${i}`}
                            >
                              <TrashCan />
                            </IconButton>
                          )}
                        </div>
                      ))}
                      <Button
                        size="sm"
                        onClick={() =>
                          setCriteria({
                            ...rubricCriteria,
                            options: [...rubricCriteria.options, { name: '', description: '' }],
                          })
                        }
                        renderIcon={Add}
                        kind="tertiary"
                      >
                        Add Option
                      </Button>
                    </Layer>
                  </div>
                </TabPanel>
                <TabPanel>
                  <JSONTextArea
                    isValidRawJSONCriteria={isValidRawJSONCriteria}
                    rawJSONCriteria={rawJSONCriteria}
                    setRawJSONCriteria={setRawJSONCriteria}
                    rowCount={18}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
