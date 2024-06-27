import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { Benchmark, CriteriaBenchmark, PipelineType } from '@utils/types'
import { stringifyQueryParams } from '@utils/utils'

import { useBenchmarksContext } from './BenchmarksProvider'

interface URLInfoContextValue {
  benchmark: Benchmark | null
  selectedCriteriaName: string | null
  updateURLFromBenchmark: (benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => void
}

const URLInfoContext = createContext<URLInfoContextValue>({
  benchmark: null,
  selectedCriteriaName: null,
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
    const urlType: PipelineType | null = router.query.type ? (router.query.type as PipelineType) : null
    const criteriaName = router.query.criteriaName ? (router.query.criteriaName as string) : null
    if (urlBenchmark !== null && urlType !== null) {
      const selectedBenchmark = benchmarks.find((b) => b.name === urlBenchmark && b.type === urlType) as Benchmark
      return selectedBenchmark
    } else {
      return null
    }
  }, [benchmarks, router.query.benchmark, router.query.criteriaName, router.query.type])

  const updateURLFromBenchmark = useCallback(
    (benchmark: Benchmark, criteriaBenchmark?: CriteriaBenchmark) => {
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
      router.push(`/benchmarks/${paramsString}`, `/benchmarks/${paramsString}`, {
        shallow: true,
      })
      // use case is a saved user test case
    },
    [router],
  )

  return (
    <URLInfoContext.Provider
      value={{
        benchmark,
        updateURLFromBenchmark,
        selectedCriteriaName: criteriaName,
      }}
    >
      {children}
    </URLInfoContext.Provider>
  )
}
