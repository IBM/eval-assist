import { ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { Benchmark, EvaluationType, FetchedBenchmark } from '@types'
import { capitalizeFirstWord } from '@utils'

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
        url: fetchedBenchmark.url,
        type: fetchedBenchmark.type,
        dataset: fetchedBenchmark.dataset,
        tags: fetchedBenchmark.tags,
        criteriaBenchmarks: fetchedBenchmark.criteria_benchmarks.map((criteria_benchmark) => ({
          name: criteria_benchmark.name,
          catalogCriteriaName: capitalizeFirstWord(criteria_benchmark.catalog_criteria_name),
          evaluatorBenchmarks: criteria_benchmark.evaluator_benchmarks,
          datasetLen: criteria_benchmark.dataset_len,
        })),
      }))
      benchmarks.sort((b1, b2) => b1.name.localeCompare(b2.name))
      benchmarks.forEach((benchmark) => {
        benchmark.criteriaBenchmarks.sort((c1, c2) => {
          if (c1.name === 'overall') return -1
          if (c2.name === 'overall') return 1
          return c1.name.localeCompare(c2.name)
        })
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
