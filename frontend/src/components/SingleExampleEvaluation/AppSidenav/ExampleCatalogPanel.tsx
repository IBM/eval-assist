import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare } from '@carbon/react/icons'

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'

import { UseCase } from '../../../types'
import { useCurrentTestCase } from '../Providers/CurrentTestCaseProvider'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'
import sharedClasses from './shared.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
}

export const ExampleCatalogPanel = ({ onClose, onUseCaseClick }: Props) => {
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

  const onClick = (e: any, useCase: UseCase) => {
    e.stopPropagation()
    e.preventDefault()
    onUseCaseClick(useCase)
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
              {rubricLibraryTestCases.map((useCase, i) => (
                <TreeNode
                  className={cx(sharedClasses.hovered)}
                  label={
                    <div className={cx(classes.treeNodeContent)}>
                      <span className={classes.treeNodeLAabel}>{useCase.name}</span>
                      <LinkButton useCase={useCase} />
                    </div>
                  }
                  key={`${useCase.name}_direct`}
                  id={`${useCase.name}_direct`}
                  selected={selectedNode}
                  renderIcon={Compare}
                  onClick={(e: any) => onClick(e, useCase)}
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
              {pairwiseLibraryTestCases.map((useCase, i) => (
                <TreeNode
                  className={cx(sharedClasses.hovered)}
                  label={
                    <div className={classes['treeNodeContent']}>
                      <span className={classes['treeNodeLAabel']}>{useCase.name}</span>
                      <LinkButton useCase={useCase} />
                    </div>
                  }
                  key={`${useCase.name}_pairwise`}
                  id={`${useCase.name}_pairwise`}
                  renderIcon={Compare}
                  onClick={(e: any) => onClick(e, useCase)}
                />
              ))}
            </TreeNode>
          </TreeView>
        </div>
      </div>
    </section>
  )
}
