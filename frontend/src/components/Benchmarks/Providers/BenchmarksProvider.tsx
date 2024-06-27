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
      setBenchmarks(await (await fetch('/api/benchmarks')).json())
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
