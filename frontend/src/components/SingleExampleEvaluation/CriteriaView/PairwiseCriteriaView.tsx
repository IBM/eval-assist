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
  TextInput,
} from '@carbon/react'
import { Edit, Save } from '@carbon/react/icons'

import { HighlightTextArea } from '@components/HighlightTextArea'
import { PairwiseComparisonCriteria } from '@types'
import { isInstanceOfPairwiseCriteria } from '@utils/utils'

import { JSONTextArea } from '../JSONTextArea'
import classes from '../SingleExampleEvaluation.module.scss'
import customClasses from './index.module.scss'

interface EvaluationCriteriaProps {
  pairwiseCriteria: PairwiseComparisonCriteria
  setCriteria: Dispatch<SetStateAction<PairwiseComparisonCriteria>>
  selectedTabIndex: number
  setSelectedTabIndex: Dispatch<SetStateAction<number>>
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
  className?: string
  style?: CSSProperties
}

export const PairwiseCriteriaView = ({
  pairwiseCriteria,
  setCriteria,
  selectedTabIndex,
  setSelectedTabIndex,
  toHighlightWords,
  style,
}: EvaluationCriteriaProps) => {
  const [isEditingCriteriaTitle, setIsEditingCriteriaTitle] = useState(pairwiseCriteria.name === '')
  const [rawJSONCriteria, setRawJSONCriteria] = useState('')

  const isValidRawJSONCriteria = (jsonCriteria: string) => {
    try {
      const rawJSONCriteriaObj = JSON.parse(jsonCriteria)
      return isInstanceOfPairwiseCriteria(rawJSONCriteriaObj)
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
      setRawJSONCriteria(JSON.stringify(pairwiseCriteria, null, 4))
    }
  }

  return (
    <div style={style}>
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
                              value={pairwiseCriteria.name}
                              onChange={(e) => setCriteria({ ...pairwiseCriteria, name: e.target.value })}
                              readOnly={!isEditingCriteriaTitle}
                              id="text-input-criteria-title"
                              placeholder="Criteria title"
                              style={{ width: '95%' }}
                            />
                          ) : (
                            <h4 style={{ width: '95%' }}>{pairwiseCriteria.name}</h4>
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
                        value={pairwiseCriteria.description}
                        className={customClasses.criteriaText}
                        isTextInput={false}
                        isTextArea={true}
                        editorId={'criteria-description-rubric'}
                        style={{ marginBottom: '1rem' }}
                        placeholder="Describe your evaluation criteria as a question e.g Is the response gramatically correct?"
                        onValueChange={(value: string) =>
                          setCriteria({
                            ...pairwiseCriteria,
                            description: value,
                          })
                        }
                      />
                    </Layer>
                  </div>
                </TabPanel>
                <TabPanel>
                  <JSONTextArea
                    isValidRawJSONCriteria={isValidRawJSONCriteria}
                    rawJSONCriteria={rawJSONCriteria}
                    setRawJSONCriteria={setRawJSONCriteria}
                    rowCount={4}
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
