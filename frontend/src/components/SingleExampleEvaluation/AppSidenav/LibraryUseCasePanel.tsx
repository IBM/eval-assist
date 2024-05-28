import cx from 'classnames'

import { useEffect, useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare, List } from '@carbon/react/icons'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'

import { usePipelineTypesContext } from '../Providers/PipelineTypesProvider'
import { libraryUseCases } from '../UseCaseLibrary'
import { PipelineType, UseCase } from '../types'
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

  const { rubricPipelines, pairwisePipelines, loadingPipelines } = usePipelineTypesContext()

  const handleToggle = (key: 'rubric' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  const rubricTestCases = useMemo(
    () =>
      libraryUseCases
        .filter((u) => u.type === PipelineType.RUBRIC)
        .map((u) =>
          rubricPipelines !== null && rubricPipelines.length > 0
            ? {
                ...u,
                pipeline: rubricPipelines[0],
              }
            : u,
        ),
    [rubricPipelines],
  )

  const pairwiseTestCases = useMemo(
    () =>
      libraryUseCases
        .filter((u) => u.type === PipelineType.PAIRWISE)
        .map((u) =>
          pairwisePipelines !== null && pairwisePipelines.length > 0
            ? {
                ...u,
                pipeline: pairwisePipelines[0],
              }
            : u,
        ),
    [pairwisePipelines],
  )

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
            <TreeView className={classes['tree-root']} label="">
              <TreeNode
                id={'rubric'}
                label={RUBRIC_NAME}
                onSelect={() => handleToggle('rubric')}
                onToggle={() => handleToggle('rubric')}
                isExpanded={expanded['rubric']}
              >
                {rubricTestCases.map((useCase, i) => (
                  <TreeNode
                    id={`rubric_${useCase.name}_id`}
                    label={useCase.name}
                    key={`rubric_${useCase.name}_id`}
                    renderIcon={List}
                    onClick={(e: any) => onClick(e, useCase)}
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
                {pairwiseTestCases.map((useCase, i) => (
                  <TreeNode
                    id={`pairwise_${useCase.name}_id`}
                    label={useCase.name}
                    key={`pairwise_${useCase.name}_id`}
                    renderIcon={Compare}
                    onClick={(e: any) => onClick(e, useCase)}
                  />
                ))}
              </TreeNode>
            </TreeView>
          </section>
        </div>
      </div>
    </section>
  )
}
