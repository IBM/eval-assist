import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useEffect, useMemo, useState } from 'react'

// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { IbmEngineeringSystemsDesignRhapsodyModelManager, List } from '@carbon/react/icons'

import { Benchmark, CriteriaBenchmark, EvaluationType } from '@types'
import { capitalizeFirstWord } from '@utils'

import { useBenchmarksContext } from '../Providers/BenchmarksProvider'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import classes from './index.module.scss'

export const BenchmarkSidenav = () => {
  const { benchmarks } = useBenchmarksContext()
  const { benchmark, selectedCriteriaName, updateURLFromBenchmark } = useURLInfoContext()
  const directBenchmarks = useMemo(
    () => benchmarks?.filter((b) => b.type === EvaluationType.DIRECT) || [],
    [benchmarks],
  )
  const pairwiseBenchmarks = useMemo(
    () => benchmarks?.filter((b) => b.type === EvaluationType.PAIRWISE) || [],
    [benchmarks],
  )
  const [typeExpanded, setTypeExpanded] = useState<{ direct: boolean; pairwise: boolean }>({
    direct: true,
    pairwise: true,
  })
  const [benchmarkExpanded, setBenchmarkExpanded] = useState<{ [key: string]: boolean }>(() => {
    const initialState: { [key: string]: boolean } = {}
    if (benchmarks) {
      benchmarks.forEach((b) => {
        initialState[`${b?.name}_${b?.type}`] = false
      })
    }
    return initialState
  })

  const handleTypeToggle = (key: 'direct' | 'pairwise') =>
    setTypeExpanded({
      ...typeExpanded,
      [key]: !typeExpanded[key],
    })

  const handleBenchmarkToggle = (key: string) =>
    setBenchmarkExpanded({
      ...benchmarkExpanded,
      [key]: !benchmarkExpanded[key],
    })

  useEffect(() => {
    if (benchmark && selectedCriteriaName !== null) {
      if (!benchmarkExpanded[`${benchmark.name}_${benchmark.type}`])
        setBenchmarkExpanded({
          ...benchmarkExpanded,
          [`${benchmark.name}_${benchmark.type}`]: true,
        })
    }
  }, [benchmark, benchmarkExpanded, selectedCriteriaName])

  const selectedBenchmarkId = useMemo(() => {
    return benchmark ? [`${benchmark.name}_${benchmark.type}`] : []
  }, [benchmark])

  const selectedCritiaBenchmarkId = useMemo(() => {
    return benchmark && selectedCriteriaName ? [`${selectedCriteriaName}_${benchmark.name}_${benchmark.type}`] : []
  }, [benchmark, selectedCriteriaName])

  const onBenchmarkClick = (e: any, benchmark: Benchmark) => {
    e.stopPropagation()
    e.preventDefault()
    updateURLFromBenchmark(benchmark)
  }

  const onBenchmarkCriteriaClick = (e: any, benchmark: Benchmark, criteriaBenchmark: CriteriaBenchmark) => {
    e.stopPropagation()
    e.preventDefault()
    updateURLFromBenchmark(benchmark, criteriaBenchmark)
  }

  return (
    <aside className={cx(classes.sidebar)}>
      <div role="tabpanel" className={classes.panel} tabIndex={-1}>
        <section className={cx(classes.root)}>
          <header className={classes.header}>
            <h2 className={classes.heading}>Benchmark Catalog</h2>
          </header>
          <div className={classes.content}>
            <div className={classes.prompts}>
              <section className={classes.section}>
                <div className={classes['tree-wrapper']}>
                  <TreeView
                    className={classes['tree-root']}
                    label=""
                    selected={selectedCritiaBenchmarkId.length > 0 ? selectedCritiaBenchmarkId : selectedBenchmarkId}
                    id={'tree-view'}
                  >
                    <TreeNode
                      id={'direct'}
                      label={DIRECT_NAME}
                      onSelect={() => handleTypeToggle('direct')}
                      onToggle={() => handleTypeToggle('direct')}
                      isExpanded={typeExpanded['direct']}
                      selected={
                        selectedBenchmarkId.length > 0 &&
                        selectedCritiaBenchmarkId.length > 0 &&
                        selectedCritiaBenchmarkId[0].endsWith(selectedBenchmarkId[0])
                          ? []
                          : selectedBenchmarkId
                      }
                    >
                      {directBenchmarks.map((directBenchmark, i) => (
                        <TreeNode
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>
                                {capitalizeFirstWord(directBenchmark.name)}
                              </span>
                            </div>
                          }
                          key={`${directBenchmark.name}_direct`}
                          id={`${directBenchmark.name}_direct`}
                          onClick={(e: any) => onBenchmarkClick(e, directBenchmark)}
                          onToggle={() => handleBenchmarkToggle(`${directBenchmark.name}_direct`)}
                          isExpanded={benchmarkExpanded[`${directBenchmark.name}_direct`]}
                          selected={selectedCritiaBenchmarkId}
                        >
                          {directBenchmark.criteriaBenchmarks.map((criteriaBenchmark, i) => (
                            <TreeNode
                              label={
                                <div className={classes['tree-node-content']}>
                                  <span
                                    className={cx(classes['tree-node-label'], classes['tree-node-label-indent'])}
                                  >{`${capitalizeFirstWord(criteriaBenchmark.name)}`}</span>
                                </div>
                              }
                              key={`${criteriaBenchmark.name}_${directBenchmark.name}_direct`}
                              id={`${criteriaBenchmark.name}_${directBenchmark.name}_direct`}
                              onClick={(e: any) => onBenchmarkCriteriaClick(e, directBenchmark, criteriaBenchmark)}
                              selected={selectedCritiaBenchmarkId}
                            />
                          ))}
                        </TreeNode>
                      ))}
                    </TreeNode>
                    <TreeNode
                      id={'pairwise'}
                      label={PAIRWISE_NAME}
                      onSelect={() => handleTypeToggle('pairwise')}
                      onToggle={() => handleTypeToggle('pairwise')}
                      isExpanded={typeExpanded['pairwise']}
                    >
                      {pairwiseBenchmarks.map((pairwiseBenchmark, i) => (
                        <TreeNode
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>
                                {capitalizeFirstWord(pairwiseBenchmark.name)}
                              </span>
                            </div>
                          }
                          key={`${pairwiseBenchmark.name}_pairwise`}
                          id={`${pairwiseBenchmark.name}_pairwise`}
                          onClick={(e: any) => onBenchmarkClick(e, pairwiseBenchmark)}
                          onToggle={() => handleBenchmarkToggle(`${pairwiseBenchmark.name}_pairwise`)}
                          isExpanded={benchmarkExpanded[`${pairwiseBenchmark.name}_pairwise`]}
                        >
                          {pairwiseBenchmark.criteriaBenchmarks.map((criteriaBenchmark, i) => (
                            <TreeNode
                              label={
                                <div className={classes['tree-node-content']}>
                                  <span
                                    className={cx(classes['tree-node-label'], classes['tree-node-label-indent'])}
                                  >{`${capitalizeFirstWord(criteriaBenchmark.name)}`}</span>
                                </div>
                              }
                              key={`${criteriaBenchmark.name}_${pairwiseBenchmark.name}_pairwise`}
                              id={`${criteriaBenchmark.name}_${pairwiseBenchmark.name}_pairwise`}
                              onClick={(e: any) => onBenchmarkCriteriaClick(e, pairwiseBenchmark, criteriaBenchmark)}
                            />
                          ))}
                        </TreeNode>
                      ))}
                    </TreeNode>
                  </TreeView>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
