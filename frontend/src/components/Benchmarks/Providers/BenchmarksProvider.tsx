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
      const fetchedBenchmarks: { [key: string]: FetchedBenchmark } = await (await get('benchmarks/')).json()
      const benchmarks: Benchmark[] = Object.values(fetchedBenchmarks).map((fetchedBenchmark) => ({
        name: fetchedBenchmark.display_name,
        description: fetchedBenchmark.description,
        catalogUrl: fetchedBenchmark.catalog_url,
        url: fetchedBenchmark.url,
        type: fetchedBenchmark.type,
        dataset: fetchedBenchmark.dataset_name,
        tags: fetchedBenchmark.tags,
        groupByFieldsToValues: Object.fromEntries(
          Object.entries(fetchedBenchmark.group_by_fields).map(([groupByField, groupByFieldResults]) => {
            const parsedGroupByFieldResults = Object.fromEntries(
              Object.entries(groupByFieldResults).map(([groupByValue, groupByValueResults]) => {
                const parsedGroupByValueResults = {
                  datasetLen: groupByValueResults.dataset_len,
                  groupByValue: groupByValueResults.group_by_value,
                  judgeResults: groupByValueResults.judge_results,
                }
                return [groupByValue, parsedGroupByValueResults]
              }),
            )
            return [groupByField, parsedGroupByFieldResults]
          }),
        ),
      }))

      benchmarks.sort((b1, b2) => b1.name.localeCompare(b2.name))
      // benchmarks.forEach((benchmark) => {
      //   benchmark.criteriaBenchmarks.sort((c1, c2) => {
      //     if (c1.name === 'overall') return -1
      //     if (c2.name === 'overall') return 1
      //     return c1.name.localeCompare(c2.name)
      //   })
      // })
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
