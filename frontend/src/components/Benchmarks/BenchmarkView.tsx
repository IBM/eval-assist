import cx from 'classnames'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { Breadcrumb, BreadcrumbItem, Button, Select, SelectItem } from '@carbon/react'
import { Launch } from '@carbon/react/icons'

import { TestCaseTypeBadge } from '@components/TestCaseTypeBadge/TestCaseTypeBadge'
import { capitalizeFirstWord, splitDotsAndCapitalizeFirstWord } from '@utils'

import benchmarkClasses from './BenchmarkView.module.scss'
import { GroupByValueResultCard } from './GroupByValueResultCard'
import { useURLInfoContext } from './Providers/URLInfoProvider'
import { BenchmarkSidenav } from './Sidenav'
import classes from './index.module.scss'

export const BenchmarkView = () => {
  const { benchmark, selectedCriteriaName } = useURLInfoContext()

  const groupByFieldOptions = useMemo(
    () => (benchmark ? Object.keys(benchmark.groupByFieldsToValues) : []),
    [benchmark],
  )

  const [selectedGroupByField, setSelectedGroupByField] = useState<string>('criteria')

  useEffect(() => {
    setSelectedGroupByField('criteria')
  }, [benchmark])

  const groupByValueToResults = useMemo(() => {
    if (!benchmark) {
      return []
    }
    return selectedGroupByField in benchmark.groupByFieldsToValues
      ? benchmark.groupByFieldsToValues[selectedGroupByField]
      : []
  }, [benchmark, selectedGroupByField])

  return (
    benchmark !== null && (
      <>
        <BenchmarkSidenav />
        <div className={cx(classes.root, classes.leftPadding)}>
          <Breadcrumb className={classes.breadcrumb}>
            <BreadcrumbItem isCurrentPage={false}>
              <Link href="/benchmarks">{'All benchmarks'}</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage={true}>
              <p>{benchmark.name}</p>
            </BreadcrumbItem>
          </Breadcrumb>
          <h3 className={cx(classes.title, classes.bottomDivider)}>Benchmarks</h3>

          <div className={cx(classes.bottomDivider, classes.benchmarkHeader)}>
            <div className={classes.benchmarkTile}>
              <h4>{splitDotsAndCapitalizeFirstWord(benchmark.name)}</h4>

              <div className={classes['vertical-divider']}></div>
              <TestCaseTypeBadge type={benchmark.type} />
            </div>
          </div>
          {/* <div className={classes.benchmarkContent}>
            <h4 className={classes.benchmarkDescriptionTitle}>Description</h4>
            <p className={classes.benchmarkDescription}>{benchmark.description}</p>
            <br></br>
          </div> */}
          <div className={benchmarkClasses['benchmark-actions-container']}>
            <div className={benchmarkClasses['benchmark-buttons-container']}>
              <Button
                href={benchmark.catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                kind={'ghost'}
                renderIcon={Launch}
              >
                {'Unitxt catalog'}
              </Button>
              {benchmark.url && (
                <Button
                  href={benchmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  kind={'ghost'}
                  renderIcon={Launch}
                >
                  {'Dataset description'}
                </Button>
              )}
            </div>

            <Select
              id={'groupByFieldOption-selector'}
              labelText={'Select an option to group results'}
              onChange={(e) => setSelectedGroupByField(e.target.value)}
              value={selectedGroupByField}
              inline
              className={benchmarkClasses['benchmark-groupby-select']}
              readOnly={groupByFieldOptions.length === 1}
            >
              <SelectItem key={'Empty'} text={''} value={''} />
              {groupByFieldOptions.map((groupByFieldOption, i) => (
                <SelectItem key={i} text={capitalizeFirstWord(groupByFieldOption)} value={groupByFieldOption} />
              ))}
            </Select>
          </div>
          <div
            className={cx(classes.criteriaBenchmark, {
              [classes.multipleColumns]: Object.keys(groupByValueToResults).length > 1,
            })}
          >
            {Object.entries(groupByValueToResults).map(([groupByValue, groupByValueResult], i) => (
              <GroupByValueResultCard
                groupByField={selectedGroupByField}
                groupByValue={groupByValue}
                groupByValueResult={groupByValueResult}
                key={i}
              />
            ))}
          </div>
        </div>
      </>
    )
  )
}
