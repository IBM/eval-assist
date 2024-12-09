import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { Benchmark, EvaluationType } from '@types'

interface BenchmarksContextValue {
  benchmarks: Benchmark[]
}

const BenchmarksContext = createContext<BenchmarksContextValue>({
  benchmarks: [],
})

export const useBenchmarksContext = () => {
  return useContext(BenchmarksContext)
}

export const BenchmarksProvider = ({ children }: { children: ReactNode }) => {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([])
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false)
  const { get } = useFetchUtils()

  useEffect(() => {
    const getBenchmarks = async () => {
      setLoadingBenchmarks(true)
      const benchmarks: Benchmark[] = await (await get('benchmarks/')).json()
      benchmarks.sort((b1, b2) => b1.name.localeCompare(b2.name))
      benchmarks.forEach((benchmark) => {
        benchmark.criteriaBenchmarks.sort((c1, c2) => c1.name.localeCompare(c2.name))
        if (
          benchmark.type === EvaluationType.OLD_PAIRWISE ||
          benchmark.type === EvaluationType.OLD_ALL_VS_ALL_PAIRWISE
        ) {
          benchmark.type = EvaluationType.PAIRWISE
        }
      })
      setBenchmarks(benchmarks)
      setLoadingBenchmarks(false)
    }
    getBenchmarks()
  }, [get])

  if (loadingBenchmarks || benchmarks.length === 0) return <Loading withOverlay />

  return (
    <BenchmarksContext.Provider
      value={{
        benchmarks,
      }}
    >
      {children}
    </BenchmarksContext.Provider>
  )
}
