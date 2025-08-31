import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'
import { returnByPipelineType, splitDotsAndCapitalizeFirstWord, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import Link from 'next/link'

import { ListItem, Tile, UnorderedList } from '@carbon/react'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { BadgeColor, Benchmark } from '@types'

import classes from './BenchmarkCard.module.scss'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { TagBadge } from './TagBadge'

interface Props {
  benchmark: Benchmark
  tagToColor: {
    [key: string]: BadgeColor
  }
  selectedCriteriaItems: string[]
  setSelectedItems: Dispatch<SetStateAction<string[]>>
}

export const BenchmarkCard = ({ benchmark, tagToColor, selectedCriteriaItems, setSelectedItems }: Props) => {
  const { isDarkMode } = useThemeContext()

  const { getURLFromBenchmark, updateURLFromBenchmark } = useURLInfoContext()

  const onClick = () => {
    updateURLFromBenchmark(benchmark)
  }

  const allCriteriaNames = useMemo(
    () => Object.keys(benchmark.groupByFieldsToValues['criteria']),
    [benchmark.groupByFieldsToValues],
  )

  const displayedCriterias = useMemo<{ name: string; highlighted: boolean; clickable: boolean }[]>(() => {
    const maximumListLength = 5
    const threeDotsItem = {
      name: '...',
      highlighted: false,
      clickable: false,
    }

    if (allCriteriaNames.length >= maximumListLength) {
      if (selectedCriteriaItems.length === 0) {
        return [
          ...allCriteriaNames.slice(0, maximumListLength).map((criteriaName) => ({
            name: criteriaName,
            highlighted: false,
            clickable: true,
          })),
          threeDotsItem,
        ]
      } else {
        const currentBenchmarkSelectedCriterias = allCriteriaNames.filter((criteriaName) =>
          selectedCriteriaItems.includes(criteriaName),
        )
        if (currentBenchmarkSelectedCriterias.length >= maximumListLength) {
          return [
            ...currentBenchmarkSelectedCriterias.map((criteriaName) => ({
              name: criteriaName,
              highlighted: true,
              clickable: true,
            })),
            threeDotsItem,
          ]
        } else {
          return [
            ...[
              ...currentBenchmarkSelectedCriterias.map((criteriaName) => ({
                name: criteriaName,
                highlighted: true,
                clickable: true,
              })),
              ...allCriteriaNames
                .filter(
                  (criteriaName) =>
                    !currentBenchmarkSelectedCriterias
                      .map((selectedCriteria) => selectedCriteria)
                      .includes(criteriaName),
                )
                .slice(0, maximumListLength - currentBenchmarkSelectedCriterias.length)
                .map((criteriaName) => ({
                  name: criteriaName,
                  highlighted: false,
                  clickable: true,
                })),
            ],
            threeDotsItem,
          ]
        }
      }
    } else {
      return allCriteriaNames.map((criteriaName) => ({
        name: criteriaName,
        highlighted: selectedCriteriaItems.includes(criteriaName),
        clickable: true,
      }))
    }
  }, [allCriteriaNames, selectedCriteriaItems])

  const onTagClick = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>, tag: string) => {
      e.preventDefault()
      e.stopPropagation()
      setSelectedItems((prevValue) => [...prevValue, tag])
    },
    [setSelectedItems],
  )

  return (
    <Tile className={cx(classes.root, { [classes['card-white-mode']]: !!!isDarkMode() })} onClick={onClick}>
      <div className={classes['title-row']}>
        <h5 className={classes.title}>{splitDotsAndCapitalizeFirstWord(benchmark.name)}</h5>
      </div>
      <UnorderedList className={classes.list}>
        {displayedCriterias.map((displayedCriteria, i) => (
          <ListItem key={i}>
            {displayedCriteria.clickable ? (
              <Link
                href={getURLFromBenchmark(
                  benchmark,
                  allCriteriaNames.find((criteriaName) => criteriaName === displayedCriteria.name),
                )}
                className={classes.nameLink}
              >
                {displayedCriteria.highlighted ? (
                  <mark>{splitDotsAndCapitalizeFirstWord(displayedCriteria.name)}</mark>
                ) : (
                  splitDotsAndCapitalizeFirstWord(displayedCriteria.name)
                )}
              </Link>
            ) : (
              <div>{displayedCriteria.name}</div>
            )}
          </ListItem>
        ))}
      </UnorderedList>
      <div className={classes.tagList}>
        <TagBadge
          name={returnByPipelineType(benchmark.type, DIRECT_NAME, PAIRWISE_NAME)}
          className={classes.badge}
          size="md"
          color={tagToColor[returnByPipelineType(benchmark.type, DIRECT_NAME, PAIRWISE_NAME)]}
          onClick={(e) => onTagClick(e, returnByPipelineType(benchmark.type, DIRECT_NAME, PAIRWISE_NAME))}
        />
        {benchmark.tags.map((tag, i) => (
          <TagBadge
            className={classes.badge}
            key={i}
            name={toTitleCase(tag)}
            color={tagToColor[tag]}
            size="md"
            onClick={(e) => onTagClick(e, tag)}
          />
        ))}
      </div>
    </Tile>
  )
}
