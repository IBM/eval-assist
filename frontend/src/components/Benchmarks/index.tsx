import { PipelineTypesProvider } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'

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
    <PipelineTypesProvider>
      <BenchmarksProvider>
        <URLInfoProvider>
          <LandingOrBenchmarkView />
        </URLInfoProvider>
      </BenchmarksProvider>
    </PipelineTypesProvider>
  )
}
