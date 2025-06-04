import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { useBenchmarksContext } from '@providers/BenchmarksProvider'
import { BadgeColor, EvaluationType, badgeColorsArray } from '@types'

import { BenchmarkCard } from './BenchmarkCard'
import { Filter } from './Filter'
import landingClasses from './Landing.module.scss'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const Landing = () => {
  const { benchmarks } = useBenchmarksContext()
  const [selectedTagItems, setSelectedTagItems] = useState<string[]>([])
  const [selectedBenchmarkItems, setSelectedBenchmarkItems] = useState<string[]>([])
  const [selectedCriteriaItems, setSelectedCriteriaItems] = useState<string[]>([])

  const filteredBenchmarks = useMemo(() => {
    let result = [...benchmarks]

    result =
      selectedBenchmarkItems.length === 0 ? result : result.filter((b) => selectedBenchmarkItems.includes(b.name))

    result =
      selectedTagItems.length === 0
        ? result
        : result.filter((b) => {
            return selectedTagItems.every((selectedTag) => {
              if (selectedTag === DIRECT_NAME && b.type === EvaluationType.DIRECT) {
                return true
              }
              if (selectedTag === PAIRWISE_NAME && b.type === EvaluationType.PAIRWISE) {
                return true
              }
              return b.tags.includes(selectedTag)
            })
          })

    result =
      selectedCriteriaItems.length === 0
        ? result
        : result.filter((b) =>
            selectedCriteriaItems.every((selectedCriteria) =>
              b.criteriaBenchmarks.map((criteriaBenchmark) => criteriaBenchmark.name).includes(selectedCriteria),
            ),
          )

    return result
  }, [benchmarks, selectedBenchmarkItems, selectedCriteriaItems, selectedTagItems])

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
    dict[DIRECT_NAME] = 'blue'
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
        <div className={landingClasses.filters}>
          <Filter
            items={benchmarks.map((b) => b.name)}
            selectedItems={selectedBenchmarkItems}
            setSelectedItems={setSelectedBenchmarkItems}
            tagToColor={tagToColor}
            title={'Benchmark filter'}
            label={selectedTagItems.length > 0 ? selectedTagItems.join(', ') : 'No filters selected'}
          />
          <Filter
            items={[DIRECT_NAME, PAIRWISE_NAME, ...allTags]}
            selectedItems={selectedTagItems}
            setSelectedItems={setSelectedTagItems}
            tagToColor={tagToColor}
            title={'Tag filter'}
            label={selectedTagItems.length > 0 ? selectedTagItems.join(', ') : 'No filters selected'}
          />
          <Filter
            items={criteriaList}
            selectedItems={selectedCriteriaItems}
            setSelectedItems={setSelectedCriteriaItems}
            tagToColor={tagToColor}
            title={'Criteria filter'}
            label={selectedCriteriaItems.length > 0 ? selectedCriteriaItems.join(', ') : 'No criterias selected'}
          />
        </div>

        {filteredBenchmarks.length > 0 ? (
          <div className={cx(landingClasses.cardsGrid)}>
            {filteredBenchmarks.map((benchmark, i) => (
              <BenchmarkCard
                selectedCriteriaItems={selectedCriteriaItems}
                setSelectedItems={setSelectedTagItems}
                key={i}
                benchmark={benchmark}
                tagToColor={tagToColor}
              />
            ))}
          </div>
        ) : (
          <p className={landingClasses.emptyFilterResult}>{'No benchmarks match your filter criteria.'}</p>
        )}
      </div>
    </>
  )
}
