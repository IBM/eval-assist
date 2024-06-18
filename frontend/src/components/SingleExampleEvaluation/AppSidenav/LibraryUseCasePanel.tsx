import cx from 'classnames'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare, List } from '@carbon/react/icons'

import { useLibraryTestCases } from '@customHooks/useLibraryTestCases'
import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'

import { useURLInfoContext } from '../Providers/URLInfoProvider'
import { UseCase } from '../types'
import { LinkButton } from './LinkButton'
import classes from './UseCasePanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
}

export const LibraryPanel = ({ onClose, onUseCaseClick }: Props) => {
  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean }>({
    rubric: true,
    pairwise: true,
  })

  const { preloadedUseCase } = useURLInfoContext()

  const selectedNode = useMemo(() => {
    return preloadedUseCase !== null && preloadedUseCase.id === null
      ? [`${preloadedUseCase.name}_${preloadedUseCase.type}`]
      : []
  }, [preloadedUseCase])

  const handleToggle = (key: 'rubric' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const { rubricLibraryTestCases, pairwiseLibraryTestCases } = useLibraryTestCases()

  const onClick = (e: any, useCase: UseCase) => {
    e.stopPropagation()
    e.preventDefault()
    onUseCaseClick(useCase)
  }

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>Example Catalog</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.prompts}>
          <section className={classes.section}>
            <div className={classes['tree-wrapper']}>
              <TreeView className={classes['tree-root']} label="" selected={selectedNode}>
                <TreeNode
                  id={'rubric'}
                  label={RUBRIC_NAME}
                  onSelect={() => handleToggle('rubric')}
                  onToggle={() => handleToggle('rubric')}
                  isExpanded={expanded['rubric']}
                >
                  {rubricLibraryTestCases.map((useCase, i) => (
                    <TreeNode
                      label={
                        <div className={classes['tree-node-content']}>
                          <span className={classes['tree-node-label']}>{useCase.name}</span>
                          <LinkButton useCase={useCase} />
                        </div>
                      }
                      key={`${useCase.name}_rubric`}
                      id={`${useCase.name}_rubric`}
                      renderIcon={List}
                      onClick={(e: any) => onClick(e, useCase)}
                      selected={selectedNode}
                    />
                  ))}
                </TreeNode>
                <TreeNode
                  id={'pairwise'}
                  label={PAIRWISE_NAME}
                  onSelect={() => handleToggle('pairwise')}
                  onToggle={() => handleToggle('pairwise')}
                  isExpanded={expanded['pairwise']}
                >
                  {pairwiseLibraryTestCases.map((useCase, i) => (
                    <TreeNode
                      label={
                        <div className={classes['tree-node-content']}>
                          <span className={classes['tree-node-label']}>{useCase.name}</span>
                          <LinkButton useCase={useCase} />
                        </div>
                      }
                      key={`${useCase.name}_pairwise`}
                      id={`${useCase.name}_pairwise`}
                      renderIcon={Compare}
                      onClick={(e: any) => onClick(e, useCase)}
                      selected={selectedNode}
                    />
                  ))}
                </TreeNode>
              </TreeView>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
