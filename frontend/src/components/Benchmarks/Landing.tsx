import cx from 'classnames'

import { useMemo, useState } from 'react'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'
import { BadgeColor, PipelineType, badgeColorsArray } from '@utils/types'

import { BenchmarkCard } from './BenchmarkCard'
import { Filter } from './Filter'
import landingClasses from './Landing.module.scss'
import { useBenchmarksContext } from './Providers/BenchmarksProvider'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const Landing = () => {
  const { benchmarks } = useBenchmarksContext()
  const [selectedTagItems, setSelectedTagItems] = useState<string[]>([])
  const [selectedCriteriaItems, setSelectedCriteriaItems] = useState<string[]>([])

  const filteredBenchmarks = useMemo(() => {
    if (selectedTagItems.length === 0 && selectedCriteriaItems.length === 0) {
      return benchmarks
    } else {
      const filteredByTags = benchmarks.filter((b) => {
        return selectedTagItems.every((selectedTag) => {
          if (selectedTag === RUBRIC_NAME && b.type === PipelineType.RUBRIC) {
            return true
          }
          if (selectedTag === PAIRWISE_NAME && b.type === PipelineType.PAIRWISE) {
            return true
          }
          return b.tags.includes(selectedTag)
        })
      })
      const filteredByCriteriasAndTag = filteredByTags.filter((b) => {
        return selectedCriteriaItems.every((selectedCriteria) => {
          return b.criteriaBenchmarks.map((criteriaBenchmark) => criteriaBenchmark.name).includes(selectedCriteria)
        })
      })
      return filteredByCriteriasAndTag
    }
  }, [benchmarks, selectedCriteriaItems, selectedTagItems])

  const allTags = useMemo(() => {
    const tags: string[] = []
    benchmarks.forEach((benchmark) => {
      benchmark.tags.forEach((tag) => {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      })
    })
    tags.sort((a, b) => b.localeCompare(a))
    return tags
  }, [benchmarks])

  const criteriaList = useMemo(() => {
    const criterias: string[] = []
    benchmarks.forEach((benchmark) =>
      benchmark.criteriaBenchmarks.forEach(
        (criteriaBenchmark) => !criterias.includes(criteriaBenchmark.name) && criterias.push(criteriaBenchmark.name),
      ),
    )
    return criterias
  }, [benchmarks])

  const tagToColor: {
    [key: string]: BadgeColor
  } = useMemo(() => {
    const dict: { [key: string]: BadgeColor } = {}
    dict[RUBRIC_NAME] = 'blue'
    dict[PAIRWISE_NAME] = 'purple'
    allTags.forEach((tag, i) => {
      const color = badgeColorsArray[i % badgeColorsArray.length]
      dict[tag] = color
    })
    return dict
  }, [allTags])

  return (
    <>
      <BenchmarkSidenav />
      <div className={cx(classes.root, landingClasses.root, classes.leftPadding)}>
        <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>
        <Filter
          items={[RUBRIC_NAME, PAIRWISE_NAME, ...allTags]}
          selectedItems={selectedTagItems}
          setSelectedItems={setSelectedTagItems}
          tagToColor={tagToColor}
          title={'Benchmarks filter'}
          label={selectedTagItems.length > 0 ? selectedTagItems.join(', ') : 'No filters selected'}
          className={landingClasses.benchmarkFilter}
        />
        <Filter
          items={criteriaList}
          selectedItems={selectedCriteriaItems}
          setSelectedItems={setSelectedCriteriaItems}
          tagToColor={tagToColor}
          title={'Criteria filter'}
          label={selectedCriteriaItems.length > 0 ? selectedCriteriaItems.join(', ') : 'No criterias selected'}
        />
        {filteredBenchmarks.length > 0 ? (
          <div className={cx(landingClasses.cardsGrid)}>
            {filteredBenchmarks.map((benchmark, i) => (
              <BenchmarkCard key={i} benchmark={benchmark} tagToColor={tagToColor} />
            ))}
          </div>
        ) : (
          <p className={landingClasses.emptyFilterResult}>{'No benchmarks match your filter criteria.'}</p>
        )}
      </div>
    </>
  )
}
