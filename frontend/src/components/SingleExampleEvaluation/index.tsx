import { Dispatch, SetStateAction, useState } from 'react'

import {
  Accordion,
  AccordionItem,
  Button,
  IconButton,
  InlineLoading,
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
import { Add, Edit, Save, TrashCan } from '@carbon/react/icons'
import classes from '@styles/SingleExampleEvaluation.module.scss'

import { post } from '@utils/fetchUtils'

interface Scale {
  value: string
  definition: string
}

type Criteria = {
  title: string
  description: string
  scales: Scale[]
}

type Results = {
  name: string
  answer: string
  explanation: string
}

interface EvaluationCriteriaProps {
  criteria: Criteria
  setCriteria: Dispatch<SetStateAction<Criteria>>
  evaluationRunning: boolean
  isEvaluationCriteriaCollapsed: boolean
  setIsEvaluationCriteriaCollapsed: Dispatch<SetStateAction<boolean>>
}

const eqSet = (xs: Set<string>, ys: Set<string>) => xs.size === ys.size && [...xs].every((x) => ys.has(x))

const EvaluationCriteria = ({
  criteria,
  setCriteria,
  evaluationRunning,
  isEvaluationCriteriaCollapsed,
  setIsEvaluationCriteriaCollapsed,
}: EvaluationCriteriaProps) => {
  const [isEditingCriteriaTitle, setIsEditingCriteriaTitle] = useState(criteria.title === '')
  const [rawJSONCriteria, setRawJSONCriteria] = useState('')

  const onJSONCriteriaChange = (e: { target: { value: string } }) => {
    setRawJSONCriteria(e.target.value)
  }

  const isValidRawJSONCriteria = () => {
    try {
      const rawJSONCriteriaObj = JSON.parse(rawJSONCriteria)
      return eqSet(new Set(Object.keys(rawJSONCriteriaObj)), new Set(['title', 'description', 'scales']))
    } catch {
      return false
    }
  }
  return (
    <div style={{ marginBottom: '2rem' }}>
      <Accordion>
        <AccordionItem
          title="Evaluation Criteria"
          open={isEvaluationCriteriaCollapsed}
          onHeadingClick={() => setIsEvaluationCriteriaCollapsed(!isEvaluationCriteriaCollapsed)}
          className={classes['wrapper']}
        >
          <div style={{}}>
            {/* <h5 style={{ marginBottom: '2rem' }}></h5> */}
            <div style={{}}>
              <Tabs>
                <TabList aria-label="List of tabs" contained>
                  <Tab>Form</Tab>
                  <Tab>JSON</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Layer style={{ padding: '0rem', marginBottom: '0rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
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
                                style={{ width: '80%' }}
                              />
                            ) : (
                              <h4 style={{ width: '80%' }}>{criteria.title}</h4>
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
                          onChange={(e) => setCriteria({ ...criteria, description: e.target.value })}
                          rows={1}
                          value={criteria.description}
                          id="text-area-evaluation-instruction"
                          labelText="Description"
                          // readOnly={evaluationRunning}
                          // placeholder="Enter your prompt..."
                          style={{ marginBottom: '1rem' }}
                        />
                        {criteria.scales.map((scale, i) => (
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
                                value={scale.value}
                                onChange={(e) =>
                                  setCriteria({
                                    ...criteria,
                                    scales: [
                                      ...criteria.scales.slice(0, i),
                                      { value: e.target.value, definition: criteria.scales[i].definition },
                                      ...criteria.scales.slice(i + 1),
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
                                value={scale.definition}
                                // readOnly={evaluationRunning}
                                id="text-input-definition"
                                onChange={(e) =>
                                  setCriteria({
                                    ...criteria,
                                    scales: [
                                      ...criteria.scales.slice(0, i),
                                      { value: criteria.scales[i].value, definition: e.target.value },
                                      ...criteria.scales.slice(i + 1),
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
                                  setCriteria({ ...criteria, scales: criteria.scales.filter((s, j) => j !== i) })
                                }
                              >
                                <TrashCan />
                              </IconButton>
                            </div>
                          </div>
                        ))}
                        <Button
                          onClick={() =>
                            setCriteria({ ...criteria, scales: [...criteria.scales, { value: '', definition: '' }] })
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
                    <TextArea
                      labelText="JSON input"
                      value={rawJSONCriteria}
                      onChange={onJSONCriteriaChange}
                      // readOnly={evaluationRunning}
                      id="text-input-json-raw"
                      placeholder="Input evaluation criteria in json format"
                      rows={10}
                      invalid={rawJSONCriteria !== '' && !isValidRawJSONCriteria()}
                      invalidText={'JSON input is invalid'}
                      style={{}}
                      type="json"
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </div>
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
  const columnNames = ['Criteria', 'Value', 'Explanation']
  return (
    <Tile
      style={{
        display: 'grid',
        gridTemplateColumns: '10% 10% 80%',
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
          <div style={dataStyle}>{results.explanation}</div>
        </>
      )}
    </Tile>
  )
}

export const SingleExampleEvaluation = () => {
  const [isEvaluationCriteriaCollapsed, setIsEvaluationCriteriaCollapsed] = useState(true)
  // const [isEvaluationInstructionCollapsed, setIsEvaluationInstructionCollapsed] = useState(false)

  const [context, setContext] = useState('How is the weather there?')
  const [modelOutput, setModelOutput] = useState(
    'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
  )

  const [criteria, setCriteria] = useState<Criteria>({
    title: 'Temperature',
    description: 'Is temperature described in both Fahrenheit and Celsius?',
    scales: [
      {
        value: 'Yes',
        definition: 'The temperature is described in both Fahrenheit and Celsius.',
      },
      {
        value: 'No',
        definition: 'The temperature is described either in Fahrenheit or Celsius but not both.',
      },
      {
        value: 'None',
        definition: 'A numerical temperature is not mentioned.',
      },
    ],
  })

  const [evaluationInstruction, setEvaluationInstruction] =
    useState(`The following tasks each contain a document, an inquiry and a response to the inquiry.
    The inquiry is about some information related to the document content
    The response should be entirely based on the content of the document, but it may fail to do so
    Your task is to determine if the response is indeed completely grounded in the document, with one of the three answers (yes, no, unsure), following by an explanation.
    To make this determination, you can consider the response as consisting of a set of claims
    If all the claims are based on the document content, you must answer yes
    If at least one of the claims are ungrounded, you must answer unsure
    Follow your answer with an explanation. Try to be concise. Limit your answer and explanation to at most 200 words. 
  `)

  const [results, setResults] = useState<Results | null>(null)

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const runEvaluation = async () => {
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate', {
      context: context,
      response: modelOutput,
      rubric: {
        criteria: criteria.description,
        options: criteria.scales.map((scale) => ({
          option: scale.value,
          description: scale.definition,
        })),
      },
    })

    const responseBody = await response.json()

    // setIsEvaluationCriteriaCollapsed(false)
    // setIsEvaluationInstructionCollapsed(false)

    setResults({
      name: criteria.title,
      answer: responseBody.option,
      explanation: responseBody.explanation,
    })

    setEvaluationRunning(false)
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Evaluation sandbox</h3>
      <TextArea
        onChange={(e) => setContext(e.target.value)}
        rows={8}
        value={context}
        id="text-area-context"
        labelText="Task context (optional)"
        // readOnly={evaluationRunning}
        // placeholder="Enter your prompt..."
        style={{ marginBottom: '1rem' }}
      />

      <TextArea
        onChange={(e) => setModelOutput(e.target.value)}
        rows={8}
        value={modelOutput}
        id="text-area-model-output"
        labelText="Response to evaluate"
        // readOnly={evaluationRunning}
        // placeholder="Enter your prompt..."
        style={{ marginBottom: '1rem' }}
      />

      <EvaluationCriteria
        criteria={criteria}
        setCriteria={setCriteria}
        evaluationRunning={false}
        isEvaluationCriteriaCollapsed={isEvaluationCriteriaCollapsed}
        setIsEvaluationCriteriaCollapsed={setIsEvaluationCriteriaCollapsed}
      />
      {/* <div style={{ backgroundColor: '#f4f4f4', marginBottom: '2rem' }}>
        <Accordion>
          <AccordionItem title="Evaluation Instruction" open={isEvaluationInstructionCollapsed} className="wrapper">
            <TextArea
              onChange={(e) => setEvaluationInstruction(e.target.value)}
              rows={10}
              value={evaluationInstruction}
              id="text-area-evaluation-instruction"
              labelText=""
              readOnly={evaluationRunning}
              style={{ backgroundColor: 'white', paddingRight: '-500px' }}
            />
          </AccordionItem>
        </Accordion>
      </div> */}
      <div style={{ marginBottom: '2rem' }}>
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
      {results !== null && <EvaluationResult results={results} />}
    </div>
  )
}
