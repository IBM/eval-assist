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
import { useURLParamsContext } from '../Providers/URLParamsProvider'
import { LinkButton } from './LinkButton'
import classes from './ThreeLevelsPanel.module.scss'

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

  const { preloadedUseCase } = useURLParamsContext()

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
              key={'direct'}
              label={DIRECT_NAME}
              onSelect={() => handleToggle('direct')}
              onToggle={() => handleToggle('direct')}
              isExpanded={expanded.direct}
            >
              {rubricLibraryTestCases.map((useCase, i) => (
                <TreeNode
                  label={
                    <div className={classes['treeNodeContent']}>
                      <span className={classes['treeNodeLAabel']}>{useCase.name}</span>
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
