// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GetServerSideProps, InferGetServerSidePropsType, NextPage } from 'next'
import { useRouter } from 'next/router'

import { Add, ArrowLeft, Close, TrashCan } from '@carbon/icons-react'
import { Column, Row } from '@carbon/react'
import { Button, Dropdown, Layer, Link, Loading, ProgressBar, TextArea, Tile } from '@carbon/react'
import '@carbon/styles/css/styles.css'

import { prisma } from '../../lib/db'

const Evaluation: NextPage = ({
  evaluation,
  selectedModels: selectedModelsProp,
  models,
  datasets,
  evaluators,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  const [isDeleting, setDeleting] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState(evaluation.dataset)
  const [prompt, setPrompt] = useState(evaluation.prompt)
  const [evaluationCriteria, setEvaluationCriteria] = useState(evaluation.criteria)
  const [run, setRun] = useState(evaluation.run)
  const [selectedModels, setSelectedModels] = useState(
    selectedModelsProp.length === 0
      ? [{}, {}]
      : selectedModelsProp.length === 1
      ? [...selectedModelsProp, {}]
      : selectedModelsProp,
  )

  const runId = useMemo(() => (run ? run.id : null), [run])

  const [userTypedSomethig, setUserTypedSomethig] = useState(prompt !== null && prompt.length > 0)

  const selectedModelsNames = useMemo<string[]>(() => {
    const result = []
    Object.values(selectedModels).forEach((sm) => {
      if ('name' in sm) {
        result.push(sm.name)
      }
    })
    return result
    // stringifying the object triggers the array dependency change when an object's property changes
    // because react performs shallow comparisson
    //eslint-disable-next-line
  }, [selectedModels])

  const [initiatingRun, setInitiatingRun] = useState(false)

  const modelDict = useMemo(
    () =>
      models.reduce((acc, obj, index) => {
        acc[obj.id] = index
        return acc
      }, {}),
    [models],
  )

  const hasRun = !(run == null)

  const progressUpdate = useCallback(async () => {
    const updated_run = await fetch('/api/runs/' + runId).then((r) => r && r.json())
    setRun(updated_run)
  }, [setRun, runId])

  //commeting this as progressTime is not used after assignment, delete when sure
  // var progressTimer

  useEffect(() => {
    if (run && run.state == 'running') {
      // progressTimer = setTimeout(progressUpdate, 3000)
      setTimeout(progressUpdate, 3000)
    }
  }, [run, progressUpdate])

  const promptTypingTimer = useRef<null | number>(null)
  const criteriaTypingTimer = useRef<null | number>(null)

  var doneTypingInterval = 1000

  const doneTypingPrompt = useCallback(async () => {
    fetch('/api/evaluation', {
      body: JSON.stringify({
        evaluation_id: evaluation.id,
        prompt: prompt,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    }).then((r) => r && r.json())
  }, [prompt, evaluation.id])

  const doneTypingCriteria = useCallback(async () => {
    fetch('/api/evaluation', {
      body: JSON.stringify({
        evaluation_id: evaluation.id,
        criteria: evaluationCriteria,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    }).then((r) => r && r.json())
  }, [evaluation.id, evaluationCriteria])

  useEffect(() => {
    if (prompt != evaluation.prompt) {
      clearTimeout(promptTypingTimer.current)
      promptTypingTimer.current = setTimeout(doneTypingPrompt, doneTypingInterval)
    }
  }, [prompt, promptTypingTimer, doneTypingPrompt, doneTypingInterval, evaluation.prompt])

  useEffect(() => {
    if (evaluationCriteria != evaluation.criteria) {
      clearTimeout(criteriaTypingTimer.current)
      criteriaTypingTimer.current = setTimeout(doneTypingCriteria, doneTypingInterval)
    }
  }, [evaluationCriteria, doneTypingCriteria, doneTypingInterval, evaluation.criteria])

  const updatePrompt = (prompt) => {
    if (!userTypedSomethig && prompt && prompt.length) setUserTypedSomethig(true)
    setPrompt(prompt)
  }

  const updateCriteria = async (criteria) => {
    setEvaluationCriteria(criteria)
  }

  const updateDataset = async (newSelectedDataset) => {
    setSelectedDataset(newSelectedDataset)
    fetch('/api/evaluation', {
      body: JSON.stringify({
        evaluation_id: evaluation.id,
        datasetId: newSelectedDataset.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    }).then((r) => {
      r && r.json()
    })
  }

  /* 
  Remove model id at a particular index. Will cause corresponding 
  UI component to be also removed.
  */
  const deleteModelIdAtIndex = (display_index: number) => {
    if ('id' in selectedModels[display_index]) {
      removeModelFromEvaluation(selectedModels[display_index])
    }
    const clone = selectedModels.slice()
    clone.splice(display_index, 1)
    setSelectedModels(clone)
  }

  const addModelToEvaluation = async (modelName, index) => {
    fetch('/api/models', {
      body: JSON.stringify({
        evaluation_id: evaluation.id,
        name: modelName,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        const selectedModelsCopy = [...selectedModels]
        const newModelSelected = {
          name: modelName,
          id: data.id,
        }
        selectedModelsCopy[index] = newModelSelected
        setSelectedModels(selectedModelsCopy)
      })
  }

  const removeModelFromEvaluation = async (model_obj) => {
    fetch('/api/models', {
      body: JSON.stringify({
        id: model_obj.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    }).then((r) => r && r.json())
  }

  const updateModelOnEvaluation = async (model_obj) => {
    fetch('/api/models', {
      body: JSON.stringify({
        id: model_obj.id,
        name: model_obj.name,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    }).then((r) => r && r.json())
  }

  const scrollToTop = async () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const runEvaluation = async () => {
    // TODO validate
    setInitiatingRun(true)

    const run = await fetch('/api/runs', {
      body: JSON.stringify({
        evaluation_id: evaluation.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((r) => r && r.json())
      .finally(() => setInitiatingRun(false))

    if (run) {
      setRun(run)
      scrollToTop()
    }
  }

  const deleteEvaluation = async () => {
    setDeleting(true)

    await fetch('/api/evaluation', {
      body: JSON.stringify({
        id: evaluation.id,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    })
      .then((r) => {
        router.push('/')
      })
      .finally(() => {
        setDeleting(false)
      })
  }

  const invalidPromptError = useCallback(() => {
    if (!(prompt && prompt.length > 0)) {
      return 'The prompt is empty'
    }
    if (selectedDataset !== null) {
      const usesInputVariables = (selectedDataset.variables.map((v) => v.name) as string[]).every((varName) => {
        const varNameFormatted = `{${varName}}`
        const found = prompt.match(new RegExp(varNameFormatted, 'g'))
        return found && found.length
      })
      if (usesInputVariables) {
        return ''
      } else {
        return 'Use input data variables in your prompt with braces i.e. {variable_name}'
      }
    } else {
      // when there is not a dataset selected assume the prompt is valid
      // user won't be able to create the evaluation anyways
      return ''
    }
  }, [prompt, selectedDataset])

  const validPrompt = useCallback(() => invalidPromptError() === '', [invalidPromptError])

  const validState = useCallback(() => {
    return (
      validPrompt() &&
      evaluationCriteria &&
      evaluationCriteria.length > 0 &&
      selectedModels &&
      selectedModels.length >= 2 &&
      selectedDataset
    )
  }, [evaluationCriteria, selectedModels, selectedDataset, validPrompt])

  return (
    <>
      {isDeleting && <Loading></Loading>}
      <Row>
        <Column>
          <div style={{ marginBottom: '20px' }}>
            <Link renderIcon={ArrowLeft} href="/">
              All Evaluations
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>
              {/* <span><IbmWatsonDiscovery size={32}/></span>  */}
              {evaluation.name}
            </h1>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                kind="danger--ghost"
                renderIcon={TrashCan}
                disabled={isDeleting}
                onClick={() => {
                  deleteEvaluation()
                }}
              >
                Delete
              </Button>
            </div>
          </div>

          {run && (
            <>
              <h3 style={{ marginBottom: '10px' }}>Progress</h3>

              <Tile style={{ marginBottom: '20px', border: '2px solid green' }}>
                {run && (
                  <Row style={{ marginBottom: '10px' }}>
                    <Column lg={15} gap="15px">
                      <ProgressBar
                        label={
                          run.state === 'running'
                            ? 'Running evaluation ' + run.progress + '%'
                            : run.state === 'finished'
                            ? 'Finished'
                            : run.state === 'error'
                            ? 'Evaluation failed'
                            : ''
                        }
                        value={run.progress}
                        status={
                          run.state === 'running'
                            ? 'active'
                            : run.state === 'finished'
                            ? 'finished'
                            : run.state === 'error'
                            ? 'running'
                            : ''
                        }
                      />
                      {run.state === 'finished' && (
                        <Link style={{ marginTop: '10px' }} href={'/results/' + runId}>
                          Go to results
                        </Link>
                      )}
                    </Column>
                    <Column lg={1}>
                      <Button
                        kind="ghost"
                        onClick={() => {
                          if (run.state === 'running') {
                            fetch(`/api/cancel_evaluation`, {
                              body: JSON.stringify({
                                evaluation_id: evaluation.id,
                              }),
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              method: 'POST',
                            })
                          } else if (run.state === 'finished' || run.state === 'error') {
                            fetch(`/api/cancel_evaluation`, {
                              body: JSON.stringify({
                                evaluation_id: evaluation.id,
                              }),
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              method: 'POST',
                            }).then(() => {
                              runEvaluation()
                            })
                          }
                        }}
                      >
                        {run.state === 'running'
                            ? 'Cancel'
                            : run.state === 'finished'
                            ? 'Rerun'
                            : run.state === 'error'
                            ? 'Rerun'
                            : ''}
                      </Button>
                    </Column>
                  </Row>
                )}
              </Tile>
            </>
          )}

          <h3 style={{ marginBottom: '10px' }}>Generator</h3>

          <Tile style={{ marginBottom: '20px' }}>
            <Tile style={{}}>
              <h5 style={{ marginBottom: '10px' }}>Dataset</h5>
              <Layer>
                <Dropdown
                  id="default"
                  initialSelectedItem={selectedDataset}
                  disabled={hasRun}
                  label="Choose a dataset"
                  items={datasets}
                  itemToString={(item) => (item ? item.name : '')}
                  onChange={({ selectedItem }) => updateDataset(selectedItem)}
                />
              </Layer>
              {selectedDataset && (
                <>
                  <div style={{ marginTop: '10px' }}>
                    <div>
                      Examples: <strong>{selectedDataset.num_examples}</strong>
                    </div>
                    Input Variables:
                    {selectedDataset.variables.map((object, i) => (
                      <strong key={i} style={{ marginLeft: '10px' }}>
                        &#123;{object.name}&#125;
                      </strong>
                    ))}
                  </div>
                </>
              )}
            </Tile>

            <Tile style={{}}>
              <h5 style={{ marginBottom: '10px' }}>Prompt</h5>

              <Layer>
                <TextArea
                  helperText="Use input data variables in your prompt with braces i.e. {variable_name}"
                  rows={6}
                  disabled={hasRun}
                  value={prompt || ''}
                  id="text-area-1"
                  onChange={(e) => updatePrompt(e.target.value)}
                  labelText="Insert the prompt"
                  invalid={userTypedSomethig && !validPrompt()}
                  invalidText={invalidPromptError()}
                />
              </Layer>
            </Tile>

            <Tile style={{ marginBottom: '20px' }}>
              <h5 style={{ marginBottom: '10px' }}>Choose models to evaluate</h5>

              <Layer>
                <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                  {selectedModels.map((model_obj, i) => {
                    const availableModels = models.filter((m) => !selectedModelsNames.includes(m.id))
                    return (
                      <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: 'row' }}>
                        <Dropdown
                          disabled={hasRun}
                          style={{ width: '400px' }}
                          id={'model-' + i}
                          label={'Select Model ' + (i + 1)}
                          initialSelectedItem={models[modelDict[model_obj.name]]}
                          items={availableModels}
                          itemToString={(item) => (item ? item.name : '')}
                          onChange={(selectedItem: any) => {
                            if ('name' in selectedModels[i]) {
                              // update
                              const selectedModelsCopy = [...selectedModels]
                              selectedModelsCopy[i].name = selectedItem.selectedItem.id
                              setSelectedModels(selectedModelsCopy)
                              updateModelOnEvaluation(selectedModels[i])
                            } else {
                              addModelToEvaluation(selectedItem.selectedItem.id, i)
                            }
                          }}
                        />
                        {i >= 2 && (
                          <Button
                            renderIcon={Close}
                            hasIconOnly={true}
                            disabled={hasRun}
                            tooltipPosition="right"
                            size={'md'}
                            kind={'ghost'}
                            iconDescription="Remove"
                            onClick={() => {
                              deleteModelIdAtIndex(i)
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )
                  })}
                  <Button
                    renderIcon={Add}
                    disabled={hasRun}
                    onClick={() => {
                      setSelectedModels(selectedModels.concat({}))
                    }}
                  >
                    Add model
                  </Button>
                </div>
              </Layer>
            </Tile>
          </Tile>

          <h3 style={{ marginBottom: '10px' }}>Evaluator</h3>

          <Tile style={{ marginBottom: '20px' }}>
            <Tile style={{}}>
              <h5 style={{ marginBottom: '10px' }}>Evaluator LLM</h5>
              <Layer>
                <Dropdown
                  id="evaluator-llm"
                  initialSelectedItem={evaluators[0]}
                  disabled={hasRun}
                  label="Choose a dataset"
                  items={evaluators}
                />
              </Layer>
            </Tile>

            <Tile style={{}}>
              <h5 style={{ marginBottom: '10px' }}>Evaluation Criteria</h5>
              <Layer>
                <TextArea
                  placeholder={'The output is fluent and accurate'}
                  helperText="Describe model output quality in natural language"
                  disabled={hasRun}
                  value={evaluationCriteria || ''}
                  id="text-input-1"
                  onChange={(e) => updateCriteria(e.target.value)}
                  labelText={'Describe model output quality in natural language'}
                />
              </Layer>
            </Tile>
          </Tile>

          <Button disabled={hasRun || initiatingRun || !validState()} onClick={() => runEvaluation()}>
            Run Evaluation
          </Button>
        </Column>
      </Row>
    </>
  )
}

export async function getServerSideProps(context) {
  const evaluation_id = parseInt(context.query.id)

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluation_id },
    include: { dataset: true, aimodels: true, run: true },
  })

  const variables = await prisma.inputVariable.findMany({
    where: { datasetId: evaluation.dataset?.id },
  })

  if (evaluation.dataset) evaluation.dataset.variables = variables

  const all_datasets = await prisma.dataset.findMany({
    include: {
      variables: true,
    },
  })

  const models = await fetch(`${process.env.BACKEND_API_HOST}/models`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  }).then((res) => res.json())

  const selectedModels = await prisma.model.findMany({
    where: {
      evaluationId: evaluation.id,
    },
  })
  // Sort by index to maintain order
  selectedModels.sort((a, b) => (a.index < b.index ? -1 : a.index > b.index ? 1 : 0))
  // Filter to only necessary fields
  const fieldsToKeep = ['id', 'name']
  const filteredSelectedModels = selectedModels.map((obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => fieldsToKeep.includes(key)))
  })

  const evaluators = ['meta-llama/llama-2-70b-chat']

  return {
    props: {
      evaluation: JSON.parse(JSON.stringify(evaluation)),
      datasets: all_datasets,
      models: models,
      evaluators: evaluators,
      selectedModels: filteredSelectedModels,
    },
  }
}

export default Evaluation
