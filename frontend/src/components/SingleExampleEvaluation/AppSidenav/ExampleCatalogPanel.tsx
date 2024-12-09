import cx from 'classnames'
import { PAIRWISE_NAME, RUBRIC_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare } from '@carbon/react/icons'

import { useLibraryTestCases } from '@customHooks/useLibraryTestCases'

import { UseCase } from '../../../types'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
}

export const ExampleCatalogPanel = ({ onClose, onUseCaseClick }: Props) => {
  const { rubricLibraryTestCases, pairwiseLibraryTestCases } = useLibraryTestCases()

  const [expanded, setExpanded] = useState<
    { direct_assessment: boolean; pairwise_comparison: boolean } & { [key: string]: boolean }
  >({
    direct_assessment: true,
    pairwise_comparison: true,
    ...Object.keys(rubricLibraryTestCases).reduce((acc, item, index) => ({ ...acc, [item]: true }), {}),
  })

  const { preloadedUseCase } = useURLInfoContext()

  const selectedNode = useMemo(() => {
    return preloadedUseCase !== null && preloadedUseCase.id === null
      ? [`${preloadedUseCase.name}_${preloadedUseCase.type}`]
      : []
  }, [preloadedUseCase])

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
              key={'direct_assessment'}
              label={RUBRIC_NAME}
              onSelect={() => handleToggle('direct_assessment')}
              onToggle={() => handleToggle('direct_assessment')}
              isExpanded={expanded.pairwise_comparison}
            >
              {rubricLibraryTestCases.map((useCase, i) => (
                <TreeNode
                  label={
                    <div className={classes['treeNodeContent']}>
                      <span className={classes['treeNodeLAabel']}>{useCase.name}</span>
                      <LinkButton useCase={useCase} />
                    </div>
                  }
                  key={`${useCase.name}_direct_assessment`}
                  id={`${useCase.name}_direct_assessment`}
                  selected={selectedNode}
                  renderIcon={Compare}
                  onClick={(e: any) => onClick(e, useCase)}
                />
              ))}
            </TreeNode>
            <TreeNode
              key={'pairwise_comparison'}
              label={PAIRWISE_NAME}
              onSelect={() => handleToggle('pairwise_comparison')}
              onToggle={() => handleToggle('pairwise_comparison')}
              isExpanded={expanded.pairwise_comparison}
            >
              {pairwiseLibraryTestCases.map((useCase, i) => (
                <TreeNode
                  label={
                    <div className={classes['treeNodeContent']}>
                      <span className={classes['treeNodeLAabel']}>{useCase.name}</span>
                      <LinkButton useCase={useCase} />
                    </div>
                  }
                  key={`${useCase.name}_pairwise_comparison`}
                  id={`${useCase.name}_pairwise_comparison`}
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
