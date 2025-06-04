import { BenchmarksProvider } from '@providers/BenchmarksProvider'
import { CriteriasProvider } from '@providers/CriteriasProvider'
import { EvaluatorOptionsProvider } from '@providers/EvaluatorOptionsProvider'
import { URLInfoProvider, useURLInfoContext } from '@providers/URLInfoProvider'

import { BenchmarkView } from './BenchmarkView'
import { Landing } from './Landing'

const LandingOrBenchmarkView = () => {
  const { benchmark } = useURLInfoContext()

  return benchmark !== null ? <BenchmarkView /> : <Landing />
}

export const Benchmarks = () => {
  return (
    <CriteriasProvider>
      <EvaluatorOptionsProvider>
        <BenchmarksProvider>
          <URLInfoProvider>
            <LandingOrBenchmarkView />
          </URLInfoProvider>
        </BenchmarksProvider>
      </EvaluatorOptionsProvider>
    </CriteriasProvider>
  )
}
