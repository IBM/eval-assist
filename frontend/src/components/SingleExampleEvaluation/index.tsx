import { describe } from 'node:test'

import { Dispatch, SetStateAction, useState } from 'react'

import { Button, IconButton, Tab, TabList, TabPanel, TabPanels, Tabs, TextArea, TextInput } from '@carbon/react'
import { Add, Edit, Save, TrashCan } from '@carbon/react/icons'

import { post } from '@utils/fetchUtils'

interface Scale {
  value: string
  definition: string
}

type Criteria = {
  title: string
  description: string
  scales: Scale[]
  results: {
    name: string
    answer: string
    explanation: string
  } | null
}

interface EvaluationCriteriaProps {
  criteria: Criteria
  setCriteria: Dispatch<SetStateAction<Criteria>>
  evaluationRunning: boolean
}

const eqSet = (xs: Set<string>, ys: Set<string>) => xs.size === ys.size && [...xs].every((x) => ys.has(x))

const EvaluationCriteria = ({ criteria, setCriteria, evaluationRunning }: EvaluationCriteriaProps) => {
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
    <div style={{ backgroundColor: '#f4f4f4', padding: '1rem', marginBottom: '2rem' }}>
      <h5 style={{ marginBottom: '2rem' }}>Evaluation Criteria</h5>
      <div style={{ paddingInline: '2rem' }}>
        <Tabs>
          <TabList aria-label="List of tabs" contained>
            <Tab>Form</Tab>
            <Tab>JSON</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: 'white', padding: '1rem', marginBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2rem',
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
                          style={{ backgroundColor: 'white', width: '80%' }}
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
                    readOnly={evaluationRunning}
                    // placeholder="Enter your prompt..."
                    style={{ backgroundColor: '#f4f4f4', marginBottom: '2rem' }}
                  />
                  {criteria.scales.map((scale, i) => (
                    <div
                      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '2rem' }}
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
                          readOnly={evaluationRunning}
                          id="text-input-value"
                        />
                      </div>

                      <div style={{ width: '75%', marginRight: '1rem' }}>
                        <TextInput
                          labelText="Definition"
                          value={scale.definition}
                          readOnly={evaluationRunning}
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
                          style={{ backgroundColor: 'white', paddingTop: '24px' }}
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
                </div>
                <Button renderIcon={Add} disabled kind="tertiary">
                  {'Add new criteria'}
                </Button>
              </div>
            </TabPanel>
            <TabPanel>
              <TextArea
                labelText="JSON input"
                value={rawJSONCriteria}
                onChange={onJSONCriteriaChange}
                readOnly={evaluationRunning}
                id="text-input-json-raw"
                placeholder="Input evaluation criteria in json format"
                rows={10}
                invalid={rawJSONCriteria !== '' && !isValidRawJSONCriteria()}
                invalidText={'JSON input is invalid'}
                style={{ backgroundColor: 'white' }}
                type="json"
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  )
}

interface EvaluationResult {
  criteria: Criteria
}

const EvaluationResult = ({ criteria }: EvaluationResult) => {
  const dataStyle = {
    backgroundColor: '#f4f4f4',
    padding: '2rem 1rem 2rem 1rem',
  }
  const columnNames = ['Name', 'Answer', 'Explanation']
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '10% 10% 80%',
      }}
    >
      {columnNames.map((c, i) => (
        <div style={{ paddingBottom: '1rem' }} key={i}>
          <h5>{c}</h5>
        </div>
      ))}
      {criteria.results !== null && (
        <>
          <div style={dataStyle}>{criteria.results.name}</div>
          <div style={dataStyle}>{criteria.results.answer}</div>
          <div style={dataStyle}>{criteria.results.explanation}</div>
        </>
      )}
    </div>
  )
}

export const SingleExampleEvaluation = () => {
  const [context, setContext] =
    useState(`context document: Since the incorrect and correct words sound the same, we tell the model to make a phonetic replacement.
    This is the philosophy behind training custom words into a language model. We train a custom word for eligibility with a JSON body {â€śsounds_likeâ€ť: [â€ślegibilityâ€ť, â€śknowledgeabilityâ€ť, â€śallergy abilityâ€ť, â€śL E G B D Tâ€ť]}. Custom words give phonetic cues. add as many text files as you want within a single custom model, as long as you do not exceed the maximum number of total words of 10 millions.
    Add custom words to the custom model
    You can use custom words to handle specific pronunciations of acronyms within your domain. To fix specific data inputs like IDs, dates, phone numbers, amounts, etc, you can use the designated SSML tags here
    To fix recurring words and expressions, use TTS custom dictionary
    For speed adjustment, use SSML prosody rate at the node level
    For intonation and inflexion adjustment, use Phonetic symbols or Tune-By-Example
    Re-generate audio files for each Watson Assistant output node with the new TTS custom dictionary, SSML tags and other improvements
    Iterate as many times as required.

    Context query: What is a custom word?
  `)
  const [modelOutput, setModelOutput] =
    useState(`Since the incorrect and correct words sound the same, we tell the model to make a phonetic replacement.
    This is the philosophy behind training custom words into a language model. We train a custom word for eligibility with a JSON body {‚Äúsounds_like‚Äù: [‚Äúlegibility‚Äù, ‚Äúknowledgeability‚Äù, ‚Äúallergy ability‚Äù, ‚ÄúL E G B D T‚Äù]}. Custom words give phonetic cues. add as many text files as you want within a single custom model, as long as you do not exceed the maximum number of total words of 10 millions.
    Add custom words to the custom model
    You can use custom words to handle specific pronunciations of acronyms within your domain. To fix specific data inputs like IDs, dates, phone numbers, amounts, etc, you can use the designated SSML tags here
    To fix recurring words and expressions, use TTS custom dictionary
    For speed adjustment, use SSML prosody rate at the node level
    For intonation and inflexion adjustment, use Phonetic symbols or Tune-By-Example
    Re-generate audio files for each Watson Assistant output node with the new TTS custom dictionary, SSML tags and other improvements
    Iterate as many times as required.
  `)

  const [criteria, setCriteria] = useState<Criteria>({
    title: 'Naturalness',
    description: 'Is the output sounds natural',
    scales: [
      {
        value: 'Yes',
        definition: 'Uses proper sentences throughout, looks like a skilled writer',
      },
      {
        value: 'No',
        definition: 'Purely an informal dump, no sentence structure of formatting throughout entire reposes',
      },
    ],
    results: {
      name: 'Naturalness',
      answer: 'Yes',
      explanation:
        "The output is unnatural simply because it's delivered at an inappropriate time or with the wrong tone. Natural communication involves sensitivity to social cues and an awareness of the appropriate timing and tone for different situations.",
    },
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

  const [evaluationRunning, setEvaluationRunning] = useState(false)

  const runEvaluation = async () => {
    setCriteria({ ...criteria, results: null })
    setEvaluationRunning(true)
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

    setCriteria({
      ...criteria,
      results: {
        name: criteria.title,
        answer: responseBody.option,
        explanation: responseBody.explanation,
      },
    })
    setEvaluationRunning(false)
  }

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Set up</h3>
      <TextArea
        onChange={(e) => setContext(e.target.value)}
        rows={10}
        value={context}
        id="text-area-context"
        labelText="Task context (optional)"
        readOnly={evaluationRunning}
        // placeholder="Enter your prompt..."
        style={{ marginBottom: '2rem' }}
      />

      <TextArea
        onChange={(e) => setModelOutput(e.target.value)}
        rows={10}
        value={modelOutput}
        id="text-area-model-output"
        labelText="Output to evaluate"
        readOnly={evaluationRunning}
        // placeholder="Enter your prompt..."
        style={{ marginBottom: '2rem' }}
      />
      <EvaluationCriteria criteria={criteria} setCriteria={setCriteria} evaluationRunning={evaluationRunning} />

      <TextArea
        onChange={(e) => setEvaluationInstruction(e.target.value)}
        rows={10}
        value={evaluationInstruction}
        id="text-area-evaluation-instruction"
        labelText="Evaluation Instruction"
        readOnly={evaluationRunning}
        // placeholder="Enter your prompt..."
        style={{ marginBottom: '2rem' }}
      />
      <Button style={{ marginBottom: '2rem' }} onClick={runEvaluation} disabled={evaluationRunning}>
        Evaluate
      </Button>
      {criteria.results !== null && <EvaluationResult criteria={criteria} />}
    </div>
  )
}
