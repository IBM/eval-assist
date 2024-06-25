import { BenchmarkView } from './BenchmarkView'
import { Landing } from './Landing'
import { URLInfoProvider, useURLInfoContext } from './Providers/URLInfoProvider'

const LandingOrBenchmarkView = () => {
  const { benchmark } = useURLInfoContext()
  return benchmark !== null ? <BenchmarkView /> : <Landing />
}

export const Benchmarks = () => {
  return (
    <URLInfoProvider>
      <LandingOrBenchmarkView />
    </URLInfoProvider>
  )
}
