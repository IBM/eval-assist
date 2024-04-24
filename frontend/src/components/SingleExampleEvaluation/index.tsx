import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

import {
  Accordion,
  AccordionItem,
  Button,
  CopyButton,
  IconButton,
  InlineLoading,
  InlineNotification,
  Layer,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  TextArea,
  TextInput,
  Tile,
} from '@carbon/react'
import { Add, Copy, Edit, Save, TextAlignLeft, TrashCan } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { post } from '@utils/fetchUtils'
import { isInstanceOfRubric } from '@utils/utils'

export interface Option {
  option: string
  description: string
}

export type Rubric = {
  title: string
  criteria: string
  options: Option[]
}

type Results = {
  name: string
  answer: string
  explanation: string
  positionalBias: boolean
}

interface EvaluationCriteriaProps {
  criteria: Rubric
  setCriteria: Dispatch<SetStateAction<Rubric>>
  evaluationRunning: boolean
  isEvaluationCriteriaCollapsed: boolean
  setIsEvaluationCriteriaCollapsed: Dispatch<SetStateAction<boolean>>
}

interface JSONTextAreaInterface {
  rawJSONCriteria: string
  setRawJSONCriteria: Dispatch<SetStateAction<string>>
  isValidRawJSONCriteria: (str: string) => boolean
}

const JSONTextArea = ({ rawJSONCriteria, setRawJSONCriteria, isValidRawJSONCriteria }: JSONTextAreaInterface) => {
  const onRawJSONCriteriaChange = useCallback(
    (e: { target: { value: string } }) => {
      setRawJSONCriteria(e.target.value)
    },
    [setRawJSONCriteria],
  )

  const onFormatClick = () => {
    setRawJSONCriteria(JSON.stringify(JSON.parse(rawJSONCriteria), null, 4))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawJSONCriteria)
  }

  return (
    <Layer style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="cds--label" style={{ marginBottom: 0 }}>
          Json Input
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <CopyButton onClick={copyToClipboard} />
          <IconButton kind="ghost" label={'Format'} align="bottom" onClick={onFormatClick}>
            <TextAlignLeft />
          </IconButton>
        </div>
      </div>
      <TextArea
        labelText={''}
        value={rawJSONCriteria}
        onChange={onRawJSONCriteriaChange}
        id="text-input-json-raw"
        placeholder="Input evaluation criteria in json format"
        rows={18}
        invalid={!isValidRawJSONCriteria(rawJSONCriteria)}
        invalidText={'JSON input is invalid'}
        // style={{ backgroundColor: 'white' }}
      />
    </Layer>
  )
}

const EvaluationCriteria = ({
  criteria,
  setCriteria,
  evaluationRunning,
  isEvaluationCriteriaCollapsed,
  setIsEvaluationCriteriaCollapsed,
}: EvaluationCriteriaProps) => {
  const [isEditingCriteriaTitle, setIsEditingCriteriaTitle] = useState(criteria.title === '')
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
        setCriteria(newRawJSONCriteriaObj)
      }
    } else if (e.selectedIndex === 1 && selectedTabIndex === 0) {
      setRawJSONCriteria(JSON.stringify(criteria, null, 4))
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <Accordion>
        <AccordionItem
          title="Evaluation Criteria"
          open={!isEvaluationCriteriaCollapsed}
          onHeadingClick={() => setIsEvaluationCriteriaCollapsed(!isEvaluationCriteriaCollapsed)}
          className={classes['wrapper']}
        >
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
                              value={criteria.title}
                              onChange={(e) => setCriteria({ ...criteria, title: e.target.value })}
                              readOnly={!isEditingCriteriaTitle}
                              id="text-input-criteria-title"
                              placeholder="Criteria title"
                              style={{ width: '90%' }}
                            />
                          ) : (
                            <h4 style={{ width: '90%' }}>{criteria.title}</h4>
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
                        onChange={(e) => setCriteria({ ...criteria, criteria: e.target.value })}
                        rows={1}
                        value={criteria.criteria}
                        id="text-area-evaluation-instruction"
                        labelText="Description"
                        style={{ marginBottom: '1rem' }}
                      />
                      {criteria.options.map((scale, i) => (
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
                                setCriteria({
                                  ...criteria,
                                  options: [
                                    ...criteria.options.slice(0, i),
                                    { option: e.target.value, description: criteria.options[i].description },
                                    ...criteria.options.slice(i + 1),
                                  ],
                                })
                              }
                              // readOnly={evaluationRunning}
                              id="text-input-value"
                            />
                          </div>

                          <div style={{ width: '75%', marginRight: '1rem' }}>
                            <TextInput
                              labelText="Definition"
                              value={scale.description}
                              // readOnly={evaluationRunning}
                              id="text-input-definition"
                              onChange={(e) =>
                                setCriteria({
                                  ...criteria,
                                  options: [
                                    ...criteria.options.slice(0, i),
                                    { option: criteria.options[i].option, description: e.target.value },
                                    ...criteria.options.slice(i + 1),
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
                                setCriteria({ ...criteria, options: criteria.options.filter((s, j) => j !== i) })
                              }
                            >
                              <TrashCan />
                            </IconButton>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          setCriteria({ ...criteria, options: [...criteria.options, { option: '', description: '' }] })
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

interface EvaluationResult {
  results: Results
}

const EvaluationResult = ({ results }: EvaluationResult) => {
  const dataStyle = {
    padding: '1rem 1rem 1rem 1rem',
  }

  const columnNames = ['Criteria', 'Value', 'Positional Bias', 'Explanation']
  return (
    <Tile
      style={{
        display: 'grid',
        gridTemplateColumns: '10% 10% 10% 70%',
      }}
    >
      {columnNames.map((c, i) => (
        <div style={{ padding: '1rem' }} key={i}>
          <h5>{c}</h5>
        </div>
      ))}
      {results !== null && (
        <>
          <div style={dataStyle}>{results.name}</div>
          <div style={dataStyle}>{results.answer}</div>
          <div style={dataStyle}>{results.positionalBias ? 'True' : 'False'}</div>
          <p style={dataStyle}>{results.explanation}</p>
        </>
      )}
    </Tile>
  )
}

export const SingleExampleEvaluation = () => {
  const [isEvaluationCriteriaCollapsed, setIsEvaluationCriteriaCollapsed] = useState(false)

  const [context, setContext] = useState('How is the weather there?')
  const [modelOutput, setModelOutput] = useState(
    'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
  )

  const [rubric, setRubric] = useState<Rubric>({
    title: 'Temperature',
    criteria: 'Is temperature described in both Fahrenheit and Celsius?',
    options: [
      {
        option: 'Yes',
        description: 'The temperature is described in both Fahrenheit and Celsius.',
      },
      {
        option: 'No',
        description: 'The temperature is described either in Fahrenheit or Celsius but not both.',
      },
      {
        option: 'None',
        description: 'A numerical temperature is not mentioned.',
      },
    ],
  })

  const [results, setResults] = useState<Results | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<Error | null>(null)

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate', {
      context: context,
      response: modelOutput,
      rubric,
    })

    setEvaluationRunning(false)

    if (response.status === 500) {
      setEvaluationFailed(true)
      setEvaluationError(new Error('Something went wrong running the evaluation. Please try again.'))
      return
    }

    const responseBody = await response.json()

    setResults({
      name: rubric.title,
      answer: responseBody.option,
      explanation: responseBody.explanation,
      positionalBias: responseBody.p_bias,
    })
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Evaluation sandbox</h3>
      <TextArea
        onChange={(e) => setContext(e.target.value)}
        rows={4}
        value={context}
        id="text-area-context"
        labelText="Task context (optional)"
        style={{ marginBottom: '1rem' }}
      />

      <TextArea
        onChange={(e) => setModelOutput(e.target.value)}
        rows={4}
        value={modelOutput}
        id="text-area-model-output"
        labelText="Response to evaluate"
        style={{ marginBottom: '1rem' }}
      />

      <EvaluationCriteria
        criteria={rubric}
        setCriteria={setRubric}
        evaluationRunning={false}
        isEvaluationCriteriaCollapsed={isEvaluationCriteriaCollapsed}
        setIsEvaluationCriteriaCollapsed={setIsEvaluationCriteriaCollapsed}
      />
      <div style={{ marginBottom: '1rem' }}>
        {evaluationRunning ? (
          <InlineLoading
            description={'Running evaluation...'}
            status={'active'}
            className={classes['loading-wrapper']}
          />
        ) : (
          <Button onClick={runEvaluation} disabled={evaluationRunning}>
            Evaluate
          </Button>
        )}
      </div>
      {evaluationFailed ? (
        <InlineNotification
          aria-label="closes notification"
          kind="error"
          onClose={function noRefCheck() {}}
          onCloseButtonClick={function noRefCheck() {}}
          statusIconDescription="notification"
          subtitle={evaluationError?.message}
          title="Evaluation failed"
        />
      ) : results !== null ? (
        <EvaluationResult results={results} />
      ) : null}
    </div>
  )
}
