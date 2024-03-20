// @ts-nocheck
import React, { useEffect, useState } from 'react'

import type { NextPage } from 'next'
import type { InferGetServerSidePropsType } from 'next'

import { ArrowLeft } from '@carbon/icons-react'
import { Column, FlexGrid, Row } from '@carbon/react'
import { Link, Tile } from '@carbon/react'

import { prisma } from '../../lib/db'

type Props = {
  // Add custom props here
}
const Results: NextPage = (_props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const outputIdToModelNameMap = new Map(_props.outputs.map((i) => [i.id, i.model.name]))

  return (
    <>
      <Row>
        <Column>
          <div style={{ marginBottom: '20px' }}>
            <Link renderIcon={ArrowLeft} href={'/results/' + _props.run.id}>
              {_props.run.evaluation.name} (Results)
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'flex-start' }}>
            <div style={{ marginBottom: '20px', flexBasis: '50%' }}>
              <h5 style={{ marginBottom: '20px' }}>Prompt</h5>
              <Tile>
                <pre style={{ width: '100%', whiteSpace: 'pre-wrap' }}>{_props.example.prompt}</pre>
              </Tile>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', flexBasis: '50%' }}>
              <div>
                <h5>Model outputs</h5>
              </div>
              {_props.outputs.map((output, i) => (
                <Tile key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <strong style={{ marginBottom: '10px' }}>{output.model.name}</strong>
                      <span style={{ color: '#24A148' }}>&nbsp;&#40;{output.winrate}&#37;&nbsp;Win rate&#41; </span>
                    </div>

                    <pre style={{ width: '100%', whiteSpace: 'pre-wrap' }}>{output.text}</pre>
                  </div>
                </Tile>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'flex-start' }}>
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ marginBottom: '20px' }}>Evaluation Trials</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {_props.contests.map((contest, i) => (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }} key={i}>
                    {[contest.output1, contest.output2].map((output, i) => (
                      <Tile
                        style={{
                          flexBasis: '33%',
                          border:
                            output.id == contest.winningOutput.id ? '1px solid lightgreen' : '1px solid transparent',
                        }}
                        key={i}
                      >
                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                          {outputIdToModelNameMap.get(output.id)}
                        </div>
                        <pre style={{ whiteSpace: 'pre-wrap', flexBasis: '30%' }}>{output.text}</pre>
                      </Tile>
                    ))}

                    <Tile style={{ flexBasis: '33%' }}>
                      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{'LLM Explanation'}</div>
                      <pre style={{ whiteSpace: 'pre-wrap', flexBasis: '30%' }}>{contest.explanation}</pre>
                    </Tile>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Column>
      </Row>
    </>
  )
}

export async function getServerSideProps(context) {
  const example_id = parseInt(context.query.id)
  const example = await prisma.example.findUnique({
    where: { id: example_id },
  })

  const outputs = await prisma.output.findMany({
    where: { exampleId: example?.id },
    include: { model: true },
  })

  const run = await prisma.run.findUnique({
    where: { id: example?.runId },
    include: { evaluation: true },
  })

  const contests = await prisma.contest.findMany({
    where: { exampleId: example?.id },
    include: { output1: true, output2: true, winningOutput: true },
  })

  const outputRanking = {}
  const opportunities = {}

  outputs.forEach(function (o) {
    outputRanking[o.id] = 0
    opportunities[o.id] = 0
  })

  contests.forEach(function (c) {
    outputRanking[c.winningOutput.id] += 1
    opportunities[c.output1.id] += 1
    opportunities[c.output2.id] += 1
  })

  outputs.sort(function (a, b) {
    return outputRanking[b.id] - outputRanking[a.id]
  })

  outputs.forEach(function (o) {
    o['winrate'] = Math.round((outputRanking[o.id] / opportunities[o.id]) * 100)
  })

  return {
    props: {
      example: JSON.parse(JSON.stringify(example)),
      evaluation: JSON.parse(JSON.stringify(run?.evaluation)),
      run: JSON.parse(JSON.stringify(run)),
      outputs: JSON.parse(JSON.stringify(outputs)),
      outputRanking: JSON.parse(JSON.stringify(outputRanking)),
      contests: JSON.parse(JSON.stringify(contests)),
    },
  }
}

export default Results
