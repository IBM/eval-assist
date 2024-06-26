import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

  useEffect(() => {
    const getBenchmarks = async () => {
      setBenchmarks(await (await fetch('/api/benchmarks')).json())
    }
    getBenchmarks()
  }, [])

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
