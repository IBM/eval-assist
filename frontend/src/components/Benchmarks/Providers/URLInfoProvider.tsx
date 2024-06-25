import { ReactNode, createContext, useCallback, useContext, useMemo } from 'react'

import { useRouter } from 'next/router'

import { benchmarkLibrary } from '@components/SingleExampleEvaluation/Libraries/BenchmarkLibrary'
import { Benchmark, PipelineType } from '@utils/types'
import { stringifyQueryParams } from '@utils/utils'

interface URLInfoContextValue {
  benchmark: Benchmark | null
  updateURLFromBenchmark: (benchmark: Benchmark) => void
}

const URLInfoContext = createContext<URLInfoContextValue>({
  benchmark: null,
  updateURLFromBenchmark: () => {},
})

export const useURLInfoContext = () => {
  return useContext(URLInfoContext)
}

export const URLInfoProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  const benchmark = useMemo(() => {
    const urlBenchmark = router.query.benchmark ? (router.query.benchmark as string) : null
    const urlType: PipelineType | null = router.query.type ? (router.query.type as PipelineType) : null
    if (urlBenchmark !== null && urlType !== null) {
      return benchmarkLibrary.find((b) => b.name === urlBenchmark && b.type === urlType) as Benchmark
    } else {
      return null
    }
  }, [router.query.benchmark, router.query.type])

  const updateURLFromBenchmark = useCallback(
    (benchmark: Benchmark) => {
      const paramsArray = [
        { key: 'benchmark', value: benchmark.name },
        { key: 'type', value: benchmark.type },
      ]
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
      }}
    >
      {children}
    </URLInfoContext.Provider>
  )
}
