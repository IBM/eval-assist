import { Benchmark } from '@utils/types'

import { BenchmarkView } from './BenchmarkView'
import { Landing } from './Landing'
import { URLInfoProvider, useURLInfoContext } from './Providers/URLInfoProvider'

interface Props {
  benchmarkLibrary: Benchmark[]
}

const LandingOrBenchmarkView = ({ benchmarkLibrary }: Props) => {
  const { benchmark } = useURLInfoContext()
  return benchmark !== null ? (
    <BenchmarkView benchmarkLibrary={benchmarkLibrary} />
  ) : (
    <Landing benchmarkLibrary={benchmarkLibrary} />
  )
}

export const Benchmarks = ({ benchmarkLibrary }: Props) => {
  return (
    <URLInfoProvider benchmarkLibrary={benchmarkLibrary}>
      <LandingOrBenchmarkView benchmarkLibrary={benchmarkLibrary} />
    </URLInfoProvider>
  )
}
