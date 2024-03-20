// @ts-nocheck
import React, { useCallback, useMemo, useRef, useState } from 'react'

import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import { ArrowLeft, ThumbsUp, ThumbsUpFilled } from '@carbon/icons-react'
import { Button, Column, Link, Loading, Row, Tile, Tooltip } from '@carbon/react'
import '@carbon/styles/css/styles.css'

import { CollapseButtons } from '../../components/CollapseButtons/CollapseButtons'
import { useCollapse } from '../../customHooks/useCollapse'
import { prisma } from '../../lib/db'

type Props = {
  // Add custom props here
}

const upperCaseAlphabet = String.fromCharCode(...Array(91).keys()).slice(65)
const collapseTreshhold = 200

const ModelBadge = ({ modelId }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        color: 'blue',
        backgroundColor: '#D0E2FF',
        borderRadius: '14px',
        paddingRight: '10px',
        paddingLeft: '10px',
        paddingBottom: '5px',
        paddingTop: '5px',
        marginLeft: '10px',
      }}
    >
      {modelId}
    </div>
  )
}

const ModelOutputTile = ({
  outputIndex,
  output,
  userSubmittedSelection,
}: {
  outputIndex: number
  output: any
  userSubmittedSelection: boolean
}) => {
  const elementRef = useRef<HTMLElement | null>(null)
  const { shouldUseCollapse, isCollapsed, setIsCollapsed } = useCollapse({ elementRef, collapseTreshhold })
  return (
    <Tile style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <strong>{`Model ${upperCaseAlphabet[outputIndex]}`}</strong>
          {userSubmittedSelection && <ModelBadge modelId={output.model.name} />}
        </div>
        <pre
          ref={elementRef}
          style={{
            width: '100%',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            maxHeight: shouldUseCollapse && isCollapsed ? `${collapseTreshhold}px` : undefined,
          }}
        >
          {output.text}
        </pre>

        <CollapseButtons
          shouldUseCollapse={shouldUseCollapse}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
      </div>
    </Tile>
  )
}

const Evaluation: NextPage = ({
  reviewExample,
  currentExampleIndex,
  evaluation,
  agreementsCount,
  reviewExampleCount,
  completedReviewExampleCount,
}: InfergetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [agreementPercentage, setAgreementPercentage] = useState<number>(
    Math.round((agreementsCount / completedReviewExampleCount) * 100),
  )

  const promptRef = useRef<HTMLElement | null>(null)
  const promptCollapseTreshhold = useMemo(() => 300, [])
  const {
    shouldUseCollapse: shouldUseCollapsePrompt,
    isCollapsed: isPromptCollapsed,
    setIsCollapsed: setIsPromptCollapsed,
  } = useCollapse({ elementRef: promptRef, collapseTreshhold: promptCollapseTreshhold })

  // nulls mean user didn't select any output yet
  const [userSelectedOutput, setUserSelectedOutput] = useState<number>(null)
  const [userSubmittedSelection, setUserSubmittedSelection] = useState<boolean>(false)

  const onThumbsUpClick = useCallback((outputId: number) => {
    setUserSelectedOutput(outputId)
  }, [])

  const onSubmitSelection = async () => {
    setIsLoading(true)
    const reviewExampleId = reviewExample.id
    const bestOutputId = userSelectedOutput
    await fetch('/api/best_output', {
      body: JSON.stringify({
        reviewExampleId: reviewExampleId,
        bestOutputId: bestOutputId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then(() => {
        const newPercentageAgreement =
          bestOutputId === reviewExample.bestEvalOutputId
            ? Math.round(((agreementsCount + 1) / (completedReviewExampleCount + 1)) * 100)
            : Math.round((agreementsCount / (completedReviewExampleCount + 1)) * 100)
        setAgreementPercentage(newPercentageAgreement)
      })
      .finally(() => {
        setUserSubmittedSelection(true)
        setIsLoading(false)
      })
  }

  const onNextItem = async () => {
    // todo: save user preference and navigate to next page
    router.reload()
  }

  return (
    <>
      {isLoading && <Loading></Loading>}

      <Row>
        <Column>
          <div style={{ marginBottom: '20px' }}>
            <Link renderIcon={ArrowLeft} href={'/results/' + evaluation.run.id}>
              {evaluation.name} (Results)
            </Link>
          </div>

          <div style={{ display: 'flex', marginBottom: '20px', justifyContent: 'space-between' }}>
            <div>
              <h1>Blind Review</h1>
            </div>
            {reviewExample && (
              <div>
                <h1>
                  {currentExampleIndex}/{reviewExampleCount}
                </h1>
              </div>
            )}
          </div>

          {!reviewExample && (
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              All examples have been reviewed. Return to evaluation&nbsp;
              <a href={'/results/' + evaluation.run.id}>results</a>.
            </div>
          )}
          {reviewExample && (
            <>
              <div style={{ display: 'flex', marginBottom: '20px' }}>
                Read the prompt and the model outputs,{' '}
                <strong style={{ whiteSpace: 'break-spaces' }}>{' choose the best output '}</strong> according to the
                evaluation criteria.
              </div>

              <Row>
                <Column lg={7} style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ marginBottom: '20px' }}>Prompt</h5>
                    <Tile style={{ display: 'flex', flexDirection: 'column' }}>
                      <pre
                        ref={promptRef}
                        style={{
                          width: '100%',
                          whiteSpace: 'pre-wrap',
                          overflow: 'hidden',
                          maxHeight:
                            shouldUseCollapsePrompt && isPromptCollapsed ? `${promptCollapseTreshhold}px` : undefined,
                        }}
                      >
                        {reviewExample.example.prompt}
                      </pre>
                      <CollapseButtons
                        shouldUseCollapse={shouldUseCollapsePrompt}
                        isCollapsed={isPromptCollapsed}
                        setIsCollapsed={setIsPromptCollapsed}
                      />
                    </Tile>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ marginBottom: '20px' }}>Evaluation Criteria</h5>
                    <Tile>{evaluation.criteria}</Tile>
                  </div>
                </Column>
                <Column lg={9} style={{ gap: '20px' }}>
                  <Row>
                    <Column lg={12}>
                      <h5 style={{ marginBottom: '20px' }}>Model outputs</h5>
                    </Column>
                    <Column lg={4}>
                      <Row>
                        <h5 style={{ marginBottom: '20px' }}>Ranking</h5>
                      </Row>
                      <Row condensed>
                        <Column>Yours</Column>
                        <Column>Evaluator</Column>
                      </Row>
                    </Column>
                  </Row>
                  {reviewExample.example.outputs.map((output, i) => (
                    <Row style={{ marginBottom: '15px' }} key={i}>
                      {/* The negative margin stands for the margin that the yours and evaluator components introduce */}
                      <Column lg={12} style={{ marginTop: i === 0 ? '-16px' : undefined }}>
                        <ModelOutputTile
                          outputIndex={i}
                          output={output}
                          userSubmittedSelection={userSubmittedSelection}
                        />
                      </Column>

                      {!userSubmittedSelection && (
                        <Column lg={2} style={{ display: 'flex' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {output.id === userSelectedOutput ? (
                              <ThumbsUpFilled size={15} fill="blue" />
                            ) : (
                              <Tooltip label="This output is best">
                                <ThumbsUp
                                  size={15}
                                  onClick={(e) => {
                                    onThumbsUpClick(output.id)
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </Column>
                      )}

                      {userSubmittedSelection && output.id === userSelectedOutput && (
                        <Column lg={2} style={{ display: 'flex' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <ThumbsUpFilled size={15} fill={'blue'} />
                          </div>
                        </Column>
                      )}
                      {userSubmittedSelection && output.id === reviewExample.bestEvalOutputId && (
                        <Column
                          lg={{ offset: output.id === userSelectedOutput ? 0 : 2, span: 2 }}
                          style={{ display: 'flex' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <ThumbsUpFilled size={15} fill={'blue'} />
                          </div>
                        </Column>
                      )}
                    </Row>
                  ))}
                </Column>
              </Row>
            </>
          )}
        </Column>
      </Row>
      
      {reviewExample && (
      <Row>
        <div
          style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', width: '100%', marginTop: '0px' }}
        >
          <h5>Agreement between you & evaluator</h5>
          <h1 style={{ marginBottom: '20px' }}>{currentExampleIndex === 1 ? '- %' : `${agreementPercentage} %`}</h1>
          {!userSubmittedSelection ? (
            <Button
              size={'lg'}
              style={{ marginBottom: '20px' }}
              onClick={onSubmitSelection}
              disabled={userSelectedOutput === null}
            >
              Submit to compare rankings
            </Button>
          ) : (
            <Button size={'lg'} style={{ marginBottom: '20px' }} onClick={onNextItem}>
              Next Item
            </Button>
          )}
        </div>
      </Row>
      )}
    </>
  )
}


const shuffle = (arr) => {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}


export async function getServerSideProps(context) {
  const review_id = parseInt(context.query.id)

  const review = await prisma.review.findUnique({
    where: { id: review_id },
    include: {
      evaluation: {
        include: {
          run: true,
        },
      },
    },
  })

  // Count total examples to review
  const reviewExampleCount = await prisma.reviewExample.count({
    where: {
      reviewId: review_id,
    },
  })

  // Count completed examples in review
  const completedReviewExampleCount = await prisma.reviewExample.count({
    where: {
      reviewId: review_id,
      complete: true,
    },
  })

  // Find the first incomplete review example
  const reviewExample = await prisma.reviewExample.findFirst({
    where: {
      reviewId: review_id,
      complete: false,
    },
    orderBy: { index: 'desc' },
    include: {
      example: {
        include: {
          outputs: {
            include: {
              model: true,
            },
          },
        },
      },
    },
  })

  if(reviewExample)
    reviewExample.example.outputs = shuffle(reviewExample.example.outputs);

  const agreementsCount = await prisma.reviewExample.count({
    where: {
      reviewId: review_id,
      complete: true,
      bestOutputId: { equals: prisma.reviewExample.fields.bestEvalOutputId },
    },
  })
  

  return {
    props: {
      evaluation: JSON.parse(JSON.stringify(review?.evaluation)),
      reviewExample: JSON.parse(JSON.stringify(reviewExample)),
      completedReviewExampleCount,
      currentExampleIndex: completedReviewExampleCount + 1,
      reviewExampleCount,
      agreementsCount,
    },
  }
}

export default Evaluation
