import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Loading } from '@carbon/react'

import { get } from '@utils/fetchUtils'
import { Benchmark } from '@utils/types'

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

  useEffect(() => {
    const getBenchmarks = async () => {
      setLoadingBenchmarks(true)
      const benchmarks: Benchmark[] = await (await fetch('/api/benchmarks')).json()
      benchmarks.sort((b1, b2) => b1.name.localeCompare(b2.name))
      benchmarks.forEach((benchmark) => {
        benchmark.criteriaBenchmarks.sort((c1, c2) => c1.name.localeCompare(c2.name))
      })
      setBenchmarks(benchmarks)
      setLoadingBenchmarks(false)
    }
    getBenchmarks()
  }, [])

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
