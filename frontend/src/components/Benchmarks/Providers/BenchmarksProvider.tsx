import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { Benchmark, EvaluationType, FetchedBenchmark } from '@types'

interface BenchmarksContextValue {
  benchmarks: Benchmark[] | null
}

const BenchmarksContext = createContext<BenchmarksContextValue>({
  benchmarks: null,
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
      const fetchedBenchmarks: FetchedBenchmark[] = await (await get('benchmarks/')).json()
      const benchmarks: Benchmark[] = fetchedBenchmarks.map((fetchedBenchmark) => ({
        name: fetchedBenchmark.name,
        description: fetchedBenchmark.description,
        catalogUrl: fetchedBenchmark.catalog_url,
        readmeUrl: fetchedBenchmark.readme_url,
        type: fetchedBenchmark.type,
        dataset: fetchedBenchmark.dataset,
        tags: fetchedBenchmark.tags,
        criteriaBenchmarks: fetchedBenchmark.criteria_benchmarks.map((criteria_benchmarks) => ({
          name: criteria_benchmarks.name,
          catalogCriteriaName: criteria_benchmarks.catalog_criteria_name,
          evaluatorBenchmarks: criteria_benchmarks.evaluator_benchmarks,
        })),
      }))
      benchmarks.sort((b1, b2) => b1.name.localeCompare(b2.name))
      benchmarks.forEach((benchmark) => {
        benchmark.criteriaBenchmarks.sort((c1, c2) => c1.name.localeCompare(c2.name))
      })
      setBenchmarks(benchmarks)
      setLoadingBenchmarks(false)
    }
    getBenchmarks()
  }, [get])

  if (loadingBenchmarks || benchmarks === null) return <Loading withOverlay />

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
