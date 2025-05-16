import { stringifyQueryParams } from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { Benchmark, CriteriaBenchmark, EvaluationType } from '@types'

import { useBenchmarksContext } from './BenchmarksProvider'

interface URLInfoContextValue {
  benchmark: Benchmark | null
  selectedCriteriaName: string | null
  getURLFromBenchmark: (benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => string
  updateURLFromBenchmark: (benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => void
}

const URLInfoContext = createContext<URLInfoContextValue>({
  benchmark: null,
  selectedCriteriaName: null,
  getURLFromBenchmark: () => '',
  updateURLFromBenchmark: () => {},
})

export const useURLInfoContext = () => {
  return useContext(URLInfoContext)
}

export const URLInfoProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { benchmarks } = useBenchmarksContext()
  const criteriaName = useMemo<string | null>(
    () => (router.query.criteriaName ? (router.query.criteriaName as string) : null),
    [router.query.criteriaName],
  )

  const benchmark = useMemo(() => {
    const urlBenchmark = router.query.benchmark ? (router.query.benchmark as string) : null
    const urlType: EvaluationType | null = router.query.type ? (router.query.type as EvaluationType) : null
    const criteriaName = router.query.criteriaName ? (router.query.criteriaName as string) : null
    if (urlBenchmark !== null && urlType !== null) {
      const selectedBenchmark = benchmarks.find((b) => b.name === urlBenchmark && b.type === urlType) as Benchmark
      return selectedBenchmark
    } else {
      return null
    }
  }, [benchmarks, router.query.benchmark, router.query.criteriaName, router.query.type])

  const getURLFromBenchmark = useCallback((benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => {
    const paramsArray = [
      { key: 'benchmark', value: benchmark.name },
      { key: 'type', value: benchmark.type },
    ]
    if (criteriaBenchmark !== undefined) {
      paramsArray.push({
        key: 'criteriaName',
        value: criteriaBenchmark.name,
      })
    }
    const paramsString = stringifyQueryParams(paramsArray)
    return `/benchmarks/${paramsString}`
  }, [])

  const updateURLFromBenchmark = useCallback(
    (benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => {
      const newUrl = getURLFromBenchmark(benchmark, criteriaBenchmark)
      router.push(newUrl, newUrl, {
        shallow: true,
      })
      // test case is a saved user test case
    },
    [getURLFromBenchmark, router],
  )

  return (
    <URLInfoContext.Provider
      value={{
        benchmark,
        getURLFromBenchmark,
        updateURLFromBenchmark,
        selectedCriteriaName: criteriaName,
      }}
    >
      {children}
    </URLInfoContext.Provider>
  )
}
