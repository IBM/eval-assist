import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, DotMark } from '@carbon/react/icons'

import { useURLParamsContext } from '@providers/URLParamsProvider'

import { EvaluationType, TestCase } from '../../../types'
import { LinkButton } from './LinkButton'
import classes from './TwoLevelsPanel.module.scss'
import sharedClasses from './shared.module.scss'

interface Props {
  onTestCaseClick: (testCase: TestCase) => void
  onClose: () => void
  userTestCases: TestCase[]
}

export const SavedTestCasesPanel = ({ onClose, onTestCaseClick, userTestCases }: Props) => {
  const { testCaseId } = useURLParamsContext()

  const selectedNode = useMemo(() => {
    return testCaseId !== null ? [`${testCaseId}`] : []
  }, [testCaseId])

  const [expanded, setExpanded] = useState<{ direct: boolean; pairwise: boolean }>({
    direct: true,
    pairwise: true,
  })

  const directAssessmentTestCases = useMemo(
    () => userTestCases.filter((u) => u.type === EvaluationType.DIRECT),
    [userTestCases],
  )
  const pairwiseComparisonTestCases = useMemo(
    () => userTestCases.filter((u) => u.type === EvaluationType.PAIRWISE),
    [userTestCases],
  )

  const handleToggle = (key: 'direct' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>My Test Cases</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.prompts}>
          <section className={classes.section}>
            {userTestCases.length === 0 ? (
              <p className={classes['empty-message']}>No saved test cases</p>
            ) : (
              <div className={classes['tree-wrapper']}>
                <TreeView className={classes['tree-root']} label={''} hideLabel selected={selectedNode}>
                  <TreeNode
                    id={'direct'}
                    label={DIRECT_NAME}
                    onSelect={() => handleToggle('direct')}
                    onToggle={() => handleToggle('direct')}
                    isExpanded={expanded['direct']}
                  >
                    {directAssessmentTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      directAssessmentTestCases.map((testCase) => (
                        <TreeNode
                          onSelect={() => {
                            onTestCaseClick(testCase)
                          }}
                          key={`${testCase.id}`}
                          id={`${testCase.id}`}
                          selected={selectedNode}
                          renderIcon={DotMark}
                          className={cx(sharedClasses.hovered)}
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{testCase.name}</span>
                              <LinkButton testCase={testCase} />
                            </div>
                          }
                        />
                      ))
                    )}
                  </TreeNode>
                  <TreeNode
                    id={'pairwise'}
                    label={PAIRWISE_NAME}
                    onSelect={() => handleToggle('pairwise')}
                    onToggle={() => handleToggle('pairwise')}
                    isExpanded={expanded['pairwise']}
                  >
                    {pairwiseComparisonTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      pairwiseComparisonTestCases.map((testCase) => (
                        <TreeNode
                          onSelect={() => {
                            onTestCaseClick(testCase)
                          }}
                          key={`${testCase.id}`}
                          id={`${testCase.id}`}
                          selected={selectedNode}
                          renderIcon={DotMark}
                          className={cx(sharedClasses.hovered)}
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{testCase.name}</span>
                              <LinkButton testCase={testCase} />
                            </div>
                          }
                        />
                      ))
                    )}
                  </TreeNode>
                </TreeView>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
