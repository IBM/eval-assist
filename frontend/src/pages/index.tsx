// @ts-nocheck
import React, { useEffect, useState } from 'react'

import type { NextPage } from 'next'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

import { CircleFilled, NewTab } from '@carbon/icons-react'
import { Column, Grid } from '@carbon/react'
import { Button, ClickableTile, FlexGrid, Loading, Modal, Row, TextInput } from '@carbon/react'
import styles from '@styles/Home.module.scss'

import { prisma } from '../lib/db'

type Props = {
  // Add custom props here
}

const Home: NextPage = (_props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [evaluationName, setEvaluationName] = useState('')
  const [creatingEvaluation, setCreatingEvaluation] = useState(false)
  const [loading, setLoading] = useState(false)

  const createEvaluation = async () => {
    try {
      setCreatingEvaluation(false)
      setLoading(true)

      const evaluation = await fetch('api/evaluation', {
        body: JSON.stringify({
          name: evaluationName,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }).then((r) => r && r.json())

      router.push('/evaluation/' + evaluation.id)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
      setEvaluationName('')
    }
  }

  return (
    <>
      {creatingEvaluation && (
        <Modal
          selectorPrimaryFocus={'.focusme'}
          open={creatingEvaluation}
          onRequestClose={() => {
            setCreatingEvaluation(false)
          }}
          modalHeading="Create an evaluation"
          primaryButtonText="OK"
          onRequestSubmit={() => {
            createEvaluation()
          }}
        >
          <TextInput
            className="focusme"
            autoFocus={true}
            labelText="Evaluation name"
            id="text-area-1"
            value={evaluationName}
            onChange={(e) => {
              setEvaluationName(e.target.value)
            }}
          />
        </Modal>
      )}

      <FlexGrid condensed fullWidth>
        <Row>
          <Column>
            <div style={{ marginBottom: '20px' }}>
              <Button
                renderIcon={NewTab}
                onClick={() => {
                  setCreatingEvaluation(true)
                }}
              >
                New Evaluation
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {loading && <Loading />}

              {_props.evaluations.map((object, i) => (
                <ClickableTile
                  key={i}
                  onClick={() => {
                    router.push('/evaluation/' + object.id)
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignContent: 'center',
                      height: '100%',
                      flexDirection: 'column',
                    }}
                  >
                    {/* <div><IbmWatsonDiscovery size={24} style ={{color: "gray"}}/></div> */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ color: 'grey' }}>Evaluation</div>

                      {object.run && (
                        <div>
                          <CircleFilled fill="green"></CircleFilled>
                        </div>
                      )}
                      {!object.run && (
                        <div>
                          <CircleFilled fill="gray"></CircleFilled>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 'larger' }}>
                      <strong>{object.name}</strong>
                    </div>
                    <div style={{ color: 'grey' }}>
                      {new Date(object.created_at).toLocaleDateString('en-us', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </div>
                  </div>
                </ClickableTile>
              ))}
            </div>
          </Column>
        </Row>
      </FlexGrid>
    </>
  )
}

export async function getServerSideProps({ req, res }) {
  const evaluations = await prisma.evaluation.findMany({
    include: { run: true },
  })

  evaluations.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

  return {
    props: {
      evaluations: JSON.parse(JSON.stringify(evaluations)),
    },
  }
}

export default Home
