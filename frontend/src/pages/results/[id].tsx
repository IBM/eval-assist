// @ts-nocheck
import _ from 'lodash'

import React, { useEffect, useState } from 'react'

import type { NextPage } from 'next'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'

import { StackedBarChart } from '@carbon/charts-react'
import '@carbon/charts/styles.css'
import { Close, Information } from '@carbon/icons-react'
import { ArrowLeft, Checkmark } from '@carbon/icons-react'
import { Column, FlexGrid, Row } from '@carbon/react'
import { Link, Tile } from '@carbon/react'
import { DataTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip } from '@carbon/react'
import styles from '@styles/Home.module.scss'

import { prisma } from '../../lib/db'
import classes from './results.module.css'

type Props = {
  // Add custom props here
}
const Results: NextPage = (_props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const rows = _props.leaderboard

  const headers = [
    {
      key: 'model',
      header: 'Model',
    },
    {
      key: 'win_rate',
      header: (
        <div style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center' }}>
          <Tooltip
            label={
              <p style={{ textAlign: 'center' }}>
                {'This represents the aggregated percentage of model outputs preferred by the evaluator LLM'}
              </p>
            }
            align="top"
          >
            <button style={{ backgroundColor: 'transparent', border: 'none' }}>
              <Information />
            </button>
          </Tooltip>
          Win rate
        </div>
      ),
    },
  ]

  const exampleHeaders = [
    {
      key: 'bestEvalOutput',
      header: 'Best Output',
      isSortable: true,
    },
    {
      key: 'model',
      header: 'Model',
    },
    {
      key: 'agreement',
      header: 'Agreement',
    },
    {
      key: 'id',
      header: 'Details',
    },
  ]

  const performanceChartOptions = {
    title: 'Model Peformance',
    axes: {
      left: {
        scaleType: 'labels',
        truncation: {
          numCharacter: 40,
        },
      },
      bottom: {
        stacked: true,
      },
    },
    theme: 'g100',
    // "height": "400px"
  }

  const performanceChartData = _props.performace

  return (
    <>
      <Row>
        <Column>
          <div style={{ marginBottom: '20px' }}>
            <Link renderIcon={ArrowLeft} href={'/evaluation/' + _props.evaluation.id}>
              {_props.evaluation.name}
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>
              <span style={{ color: '#606060' }}>Results </span> {_props.evaluation.name}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Tile style={{ marginBottom: '20px', flex: '1 1 0' }}>
              <h5 style={{ marginBottom: '25px', marginTop: '10px' }}>Model Leaderboard</h5>

              <div className={classes['table-wrapper']}>
                <DataTable rows={rows} headers={headers}>
                  {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map((header, i) => (
                            <TableHeader key={i} {...getHeaderProps({ header })}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={i} {...getRowProps({ row })}>
                            {row.cells.map((cell, index) => (
                              <TableCell key={cell.id} style={{ fontWeight: i == 0 ? 'bold' : 'normal' }}>
                                {cell.value}
                                {headers[index].key == 'win_rate' ? '%' : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </DataTable>
              </div>
            </Tile>

            <Tile style={{ marginBottom: '20px', flex: '2 1 0' }}>
              <StackedBarChart data={performanceChartData} options={performanceChartOptions}></StackedBarChart>
            </Tile>

            <Tile style={{ marginBottom: '20px', flex: '1 1 0' }}>
              <h5 style={{ marginBottom: '25px', marginTop: '10px' }}>Agreement</h5>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {_props.agreement !== null && (
                    <>
                      <h1 style={{ marginBottom: '20px' }}>{_props.agreement + '%'}</h1>
                      <span>
                        {_props.reviewedExampleCount}/{_props.exampleCount} examples reviewed
                      </span>
                    </>
                  )}
                  {_props.agreement === null && (
                    <>
                      <h1 style={{ marginBottom: '20px' }}>{'-- %'}</h1>
                      Agreement tells you how well the evaluator LLM is performing. Review model outputs to calculate
                      agreement.
                      <br />
                    </>
                  )}
                  <br />
                  <Link href={'/review/' + _props.review.id}>Review model outputs</Link>
                </div>
              </div>
            </Tile>
          </div>

          <Tile style={{ marginBottom: '20px' }}>
            <h5 style={{ marginBottom: '25px', marginTop: '10px' }}>Evaluation Criteria</h5>
            <pre>{_props.run.evaluation.criteria}</pre>
          </Tile>

          <h1 style={{ marginBottom: '20px' }}>Evaluations</h1>
          <Tile style={{ marginBottom: '20px' }}>
            <DataTable rows={_props.exampleTableRows} headers={exampleHeaders} isSortable>
              {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header, i) => (
                        <TableHeader key={i} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} {...getRowProps({ row })}>
                        {row.cells.map((cell, index) => {
                          if (headers[index].key === 'id') {
                            // Render as a link
                            return (
                              <TableCell key={index}>
                                <Link href={'/example/' + cell.value}>Details</Link>
                              </TableCell>
                            )
                          } else if (headers[index].key === 'agreement') {
                            if (cell.value === 'yes')
                              return (
                                <TableCell>
                                  <Checkmark />
                                </TableCell>
                              )
                            else if (cell.value === 'no')
                              return (
                                <TableCell>
                                  <Close />
                                </TableCell>
                              )
                            else return <TableCell></TableCell>
                          } else {
                            return <TableCell key={index}>{cell.value}</TableCell>
                          }
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DataTable>
          </Tile>
        </Column>
      </Row>
    </>
  )
}

export async function getServerSideProps(context) {
  const run_id = parseInt(context.query.id)

  const run = await prisma.run.findUnique({
    where: { id: run_id },
    include: { evaluation: true },
  })

  const examples = await prisma.example.findMany({
    where: { runId: run_id },
    include: {
      reviewExample: {
        include: {
          example: true,
          bestOutput: true,
          bestEvalOutput: {
            include: {
              model: true,
            },
          },
        },
      },
    },
  })

  let complexKeysToFilter = [
    {
      key: 'reviewExample.example.id',
      new_key: 'id',
    },
    {
      key: 'reviewExample.bestEvalOutput.text',
      new_key: 'bestEvalOutput',
    },
    {
      key: 'reviewExample.bestOutputId',
      new_key: 'bestOutputId',
    },
    {
      key: 'reviewExample.bestEvalOutput.model.name',
      new_key: 'model',
    },
    {
      key: 'reviewExample.bestEvalOutputId',
      new_key: 'bestEvalOutputId',
    },
  ]

  let examplesRows = examples.map((obj) => {
    let filteredObject = {}
    complexKeysToFilter.forEach((complexKey) => {
      let keys = complexKey.key.split('.')
      let value = keys.reduce((acc, key) => acc[key], obj)
      filteredObject[complexKey.new_key] = value
    })

    filteredObject['agreement'] = 'unknown'

    if (filteredObject['bestOutputId']) {
      if (filteredObject['bestEvalOutputId'] == filteredObject['bestOutputId']) filteredObject['agreement'] = 'yes'
      else filteredObject['agreement'] = 'no'
    }

    return filteredObject
  })

  const contests = await prisma.contest.findMany({
    where: { runId: run?.id },
    include: { output1: true, output2: true, winningOutput: true },
  })

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: run?.evaluation.id },
    include: {
      aimodels: true,
      review: true,
    },
  })

  // Generate leaderboard
  const wins = {}
  const opportunities = {}

  evaluation?.aimodels.forEach(function (m) {
    opportunities[m.id] = 0
    wins[m.id] = 0
  })

  contests.forEach(function (c) {
    opportunities[c.output1.modelId] += 1
    opportunities[c.output2.modelId] += 1
    wins[c.winningOutput.modelId] += 1
  })

  const rows = []
  const performance = []

  evaluation?.aimodels.forEach(function (m) {
    const win_rate = Math.round((wins[m.id] / opportunities[m.id]) * 100)
    const row = {
      id: m.id,
      model: m.name,
      win_rate: win_rate,
    }

    performance.push({
      group: 'Win',
      key: m.name,
      value: wins[m.id],
    })

    performance.push({
      group: 'Loss',
      key: m.name,
      value: opportunities[m.id] - wins[m.id],
    })

    rows.push(row)
  })

  rows.sort(function (a, b) {
    return b.win_rate - a.win_rate
  })

  const review = await prisma.review.findUnique({
    where: {
      evaluationId: evaluation.id,
    },
  })

  // Calculate agreement/reliability
  const reviewExamples = await prisma.reviewExample.findMany({
    where: {
      reviewId: review.id,
      complete: true,
    },
    orderBy: { index: 'desc' },
  })

  const agreement_arr = []
  for (let i = 0; i < reviewExamples.length; i++) {
    let re = reviewExamples[i]
    if (re.bestOutputId == re.bestEvalOutputId) agreement_arr.push(1)
    else agreement_arr.push(0)
  }

  let agreement = null
  if (agreement_arr.length > 0) {
    let sum = agreement_arr.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue
    }, 0)
    agreement = Math.round((sum / agreement_arr.length) * 100)
  }

  return {
    props: {
      evaluation: JSON.parse(JSON.stringify(run?.evaluation)),
      run: JSON.parse(JSON.stringify(run)),
      review: JSON.parse(JSON.stringify(evaluation?.review)),
      leaderboard: rows,
      exampleCount: examples.length,
      reviewedExampleCount: reviewExamples.length,
      agreement: agreement,
      exampleTableRows: examplesRows,
      performace: performance,
    },
  }
}

export default Results
