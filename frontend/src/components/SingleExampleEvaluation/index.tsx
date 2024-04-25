import { CSSProperties, Dispatch, SetStateAction, useCallback, useState } from 'react'

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

type Result = {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
}

type FetchedResult = {
  name: string
  option: string
  explanation: string
  p_bias: boolean
}

type FetchedResults = {
  results: FetchedResult[]
}

interface JSONTextAreaInterface {
  rawJSONCriteria: string
  setRawJSONCriteria: Dispatch<SetStateAction<string>>
  isValidRawJSONCriteria: (str: string) => boolean
  style?: CSSProperties
}

const JSONTextArea = ({
  rawJSONCriteria,
  setRawJSONCriteria,
  isValidRawJSONCriteria,
  style,
}: JSONTextAreaInterface) => {
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
    <div style={style}>
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
    </div>
  )
}

interface EvaluationCriteriaProps {
  rubric: Rubric
  setRubric: Dispatch<SetStateAction<Rubric>>
  style?: CSSProperties
}

const EvaluationCriteria = ({ rubric, setRubric, style }: EvaluationCriteriaProps) => {
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
                              labelText="Definition"
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

interface EvaluationResultsProps {
  results: Result[] | null
  evaluationFailed: boolean
  evaluationError: Error | null
  evaluationRunning: boolean
  style?: CSSProperties
}

const EvaluationResults = ({
  results,
  evaluationFailed,
  evaluationError,
  evaluationRunning,
  style,
}: EvaluationResultsProps) => {
  const dataStyle = {
    padding: '1rem 1rem 1rem 1rem',
  }

  const columnNames = ['Criteria', 'Value', 'Explanation']
  return (
    <div style={style}>
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
              {results.map((result) => (
                <>
                  <div style={dataStyle}>{result.name}</div>
                  <div style={dataStyle}>{result.option}</div>
                  <p style={dataStyle}>{result.explanation}</p>
                </>
              ))}
            </>
          )}
        </Tile>
      ) : !evaluationRunning ? (
        <p style={{ color: 'gray' }}>{'No results...'}</p>
      ) : null}
    </div>
  )
}

interface EvaluateButtonProps {
  evaluationRunning: boolean
  runEvaluation: () => Promise<void>
  style?: CSSProperties
}

const EvaluateButton = ({ evaluationRunning, runEvaluation, style }: EvaluateButtonProps) => {
  return (
    <div style={style}>
      {evaluationRunning ? (
        <InlineLoading description={'Running evaluation...'} status={'active'} className={classes['loading-wrapper']} />
      ) : (
        <Button onClick={runEvaluation} disabled={evaluationRunning}>
          Evaluate
        </Button>
      )}
    </div>
  )
}

interface ResponsesInterface {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
}

const Responses = ({ responses, setResponses, style }: ResponsesInterface) => {
  return (
    <div style={style}>
      {responses?.map((response, i) => (
        <TextArea
          onChange={(e) => setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])}
          rows={4}
          value={response}
          id="text-area-model-output"
          labelText={`Response #${i + 1}`}
          style={{ marginBottom: '1rem' }}
          key={i}
        />
      ))}
      <Button kind="tertiary" onClick={(e) => setResponses([...responses, ''])}>
        {'Add response'}
      </Button>
    </div>
  )
}

export const SingleExampleEvaluation = () => {
  const [isEvaluationCriteriaCollapsed, setIsEvaluationCriteriaCollapsed] = useState(false)

  const [context, setContext] = useState('How is the weather there?')
  const [responses, setResponses] = useState([
    'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
  ])

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

  const [results, setResults] = useState<Result[] | null>(null)
  const [evaluationFailed, setEvaluationFailed] = useState(false)
  const [evaluationError, setEvaluationError] = useState<Error | null>(null)

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const runEvaluation = async () => {
    setEvaluationFailed(false)
    setEvaluationRunning(true)
    setResults(null)
    const response = await post('evaluate', {
      context,
      responses,
      rubric,
    })

    setEvaluationRunning(false)

    if (response.status === 500) {
      setEvaluationFailed(true)
      setEvaluationError(new Error('Something went wrong running the evaluation. Please try again.'))
      return
    }

    const responseBody = (await response.json()) as FetchedResults

    setResults(
      responseBody.results.map((result) => ({
        name: rubric.title,
        option: result.option,
        explanation: result.explanation,
        positionalBias: result.p_bias,
      })),
    )
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
      <Responses responses={responses} setResponses={setResponses} style={{ marginBottom: '2rem' }} />
      <EvaluationCriteria rubric={rubric} setRubric={setRubric} style={{ marginBottom: '2rem' }} />
      <EvaluateButton
        evaluationRunning={evaluationRunning}
        runEvaluation={runEvaluation}
        style={{ marginBottom: '1rem' }}
      />

      <EvaluationResults
        results={results}
        evaluationFailed={evaluationFailed}
        evaluationError={evaluationError}
        evaluationRunning={evaluationRunning}
        style={{ marginBottom: '1rem' }}
      />
    </div>
  )
}
