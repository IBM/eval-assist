import { BenchmarkView } from './BenchmarkView'
import { Landing } from './Landing'
import { BenchmarksProvider } from './Providers/BenchmarksProvider'
import { URLInfoProvider, useURLInfoContext } from './Providers/URLInfoProvider'

const LandingOrBenchmarkView = () => {
  const { benchmark } = useURLInfoContext()

  return benchmark !== null ? <BenchmarkView /> : <Landing />
}

export const Benchmarks = () => {
  return (
    <BenchmarksProvider>
      <URLInfoProvider>
        <LandingOrBenchmarkView />
      </URLInfoProvider>
    </BenchmarksProvider>
  )
}
