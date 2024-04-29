import { CSSProperties, Dispatch, SetStateAction, useState } from 'react'

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
  TextArea,
  TextInput,
} from '@carbon/react'
import { Add, Edit, Save, TrashCan } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { isInstanceOfRubric } from '@utils/utils'

import { JSONTextArea } from './JSONTextArea'
import { Rubric } from './types'

interface EvaluationCriteriaProps {
  rubric: Rubric
  setRubric: Dispatch<SetStateAction<Rubric>>
  style?: CSSProperties
}

export const EvaluationCriteria = ({ rubric, setRubric, style }: EvaluationCriteriaProps) => {
  const [isEditingCriteriaTitle, setIsEditingCriteriaTitle] = useState(rubric.title === '')
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const [rawJSONCriteria, setRawJSONCriteria] = useState('')

  const isValidRawJSONCriteria = (jsonCriteria: string) => {
    try {
      const rawJSONCriteriaObj = JSON.parse(jsonCriteria)
      return isInstanceOfRubric(rawJSONCriteriaObj)
    } catch {
      return false
    }
  }

  const onSelectedIndexChange = (e: { selectedIndex: number }) => {
    setSelectedTabIndex(e.selectedIndex)

    if (e.selectedIndex === 0 && selectedTabIndex === 1) {
      if (isValidRawJSONCriteria(rawJSONCriteria)) {
        const newRawJSONCriteriaObj = JSON.parse(rawJSONCriteria)
        setRubric(newRawJSONCriteriaObj)
      }
    } else if (e.selectedIndex === 1 && selectedTabIndex === 0) {
      setRawJSONCriteria(JSON.stringify(rubric, null, 4))
    }
  }

  return (
    <div style={style}>
      <Accordion>
        <AccordionItem title="Evaluation Criteria" className={classes['wrapper']} open>
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
                              value={rubric.title}
                              onChange={(e) => setRubric({ ...rubric, title: e.target.value })}
                              readOnly={!isEditingCriteriaTitle}
                              id="text-input-criteria-title"
                              placeholder="Criteria title"
                              style={{ width: '90%' }}
                            />
                          ) : (
                            <h4 style={{ width: '90%' }}>{rubric.title}</h4>
                          )}
                          {isEditingCriteriaTitle ? (
                            <IconButton onClick={() => setIsEditingCriteriaTitle(false)} kind="ghost" label={'Save'}>
                              <Save />
                            </IconButton>
                          ) : (
                            <IconButton onClick={() => setIsEditingCriteriaTitle(true)} kind="ghost" label={'Save'}>
                              <Edit />
                            </IconButton>
                          )}
                        </div>
                        <IconButton label={'Remove'} size="lg" kind="ghost" onClick={() => {}}>
                          <TrashCan />
                        </IconButton>
                      </div>
                      <TextArea
                        onChange={(e) => setRubric({ ...rubric, criteria: e.target.value })}
                        rows={1}
                        value={rubric.criteria}
                        id="text-area-evaluation-instruction"
                        labelText="Description"
                        style={{ marginBottom: '1rem' }}
                      />
                      {rubric.options.map((scale, i) => (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: '1rem',
                          }}
                          key={i}
                        >
                          <div style={{ width: '20%', marginRight: '1rem' }}>
                            <TextInput
                              labelText="Value"
                              value={scale.option}
                              onChange={(e) =>
                                setRubric({
                                  ...rubric,
                                  options: [
                                    ...rubric.options.slice(0, i),
                                    { option: e.target.value, description: rubric.options[i].description },
                                    ...rubric.options.slice(i + 1),
                                  ],
                                })
                              }
                              // readOnly={evaluationRunning}
                              id="text-input-value"
                            />
                          </div>

                          <div style={{ width: '75%', marginRight: '1rem' }}>
                            <TextInput
                              labelText="Definition (optional)"
                              value={scale.description}
                              // readOnly={evaluationRunning}
                              id="text-input-definition"
                              onChange={(e) =>
                                setRubric({
                                  ...rubric,
                                  options: [
                                    ...rubric.options.slice(0, i),
                                    { option: rubric.options[i].option, description: e.target.value },
                                    ...rubric.options.slice(i + 1),
                                  ],
                                })
                              }
                            />
                          </div>

                          <div style={{ width: '5%' }}>
                            <IconButton
                              label={'Remove'}
                              size="lg"
                              kind="ghost"
                              style={{ paddingTop: '24px' }}
                              onClick={() =>
                                setRubric({ ...rubric, options: rubric.options.filter((s, j) => j !== i) })
                              }
                            >
                              <TrashCan />
                            </IconButton>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          setRubric({ ...rubric, options: [...rubric.options, { option: '', description: '' }] })
                        }
                        renderIcon={Add}
                        kind="tertiary"
                      >
                        Add scale
                      </Button>
                    </Layer>
                    {/* <Button renderIcon={Add} disabled kind="tertiary">
                          {'Add new criteria'}
                        </Button> */}
                  </div>
                </TabPanel>
                <TabPanel>
                  <JSONTextArea
                    isValidRawJSONCriteria={isValidRawJSONCriteria}
                    rawJSONCriteria={rawJSONCriteria}
                    setRawJSONCriteria={setRawJSONCriteria}
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
