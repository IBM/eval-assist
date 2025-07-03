import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, DotMark } from '@carbon/react/icons'

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'

import { TestCase } from '../../../types'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'
import sharedClasses from './shared.module.scss'

interface Props {
  onTestCaseClick: (testCase: TestCase) => void
  onClose: () => void
}

export const ExampleCatalogPanel = ({ onClose, onTestCaseClick }: Props) => {
  const { rubricLibraryTestCases, pairwiseLibraryTestCases } = useTestCaseLibrary()

  const [expanded, setExpanded] = useState<{ direct: boolean; pairwise: boolean } & { [key: string]: boolean }>({
    direct: true,
    pairwise: true,
    ...Object.keys(rubricLibraryTestCases).reduce((acc, item, index) => ({ ...acc, [item]: true }), {}),
  })

  const { preloadedTestCase } = useCurrentTestCase()

  const selectedNode = useMemo(() => {
    return preloadedTestCase !== null && preloadedTestCase.id === null
      ? [`${preloadedTestCase.name}_${preloadedTestCase.type}`]
      : []
  }, [preloadedTestCase])

  const handleToggle = (key: string) =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const onClick = (e: any, testCase: TestCase) => {
    e.stopPropagation()
    e.preventDefault()
    onTestCaseClick(testCase)
  }

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>Example Catalog - General</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.treeWrapper}>
          <TreeView label="" selected={selectedNode}>
            <TreeNode
              key={'direct'}
              label={DIRECT_NAME}
              onSelect={() => handleToggle('direct')}
              onToggle={() => handleToggle('direct')}
              isExpanded={expanded.direct}
            >
              {rubricLibraryTestCases.map((testCase, i) => (
                <TreeNode
                  className={cx(sharedClasses.hovered)}
                  label={
                    <div className={cx(classes.treeNodeContent)}>
                      <span className={classes.treeNodeLabel}>{testCase.name}</span>
                      <LinkButton testCase={testCase} />
                    </div>
                  }
                  key={`${testCase.name}_direct`}
                  id={`${testCase.name}_direct`}
                  selected={selectedNode}
                  renderIcon={DotMark}
                  onClick={(e: any) => onClick(e, testCase)}
                />
              ))}
            </TreeNode>
            <TreeNode
              key={'pairwise'}
              label={PAIRWISE_NAME}
              onSelect={() => handleToggle('pairwise')}
              onToggle={() => handleToggle('pairwise')}
              isExpanded={expanded.pairwise}
            >
              {pairwiseLibraryTestCases.map((testCase, i) => (
                <TreeNode
                  className={cx(sharedClasses.hovered)}
                  label={
                    <div className={classes['treeNodeContent']}>
                      <span className={classes['treeNodeLabel']}>{testCase.name}</span>
                      <LinkButton testCase={testCase} />
                    </div>
                  }
                  key={`${testCase.name}_pairwise`}
                  id={`${testCase.name}_pairwise`}
                  renderIcon={DotMark}
                  onClick={(e: any) => onClick(e, testCase)}
                />
              ))}
            </TreeNode>
          </TreeView>
        </div>
      </div>
    </section>
  )
}
