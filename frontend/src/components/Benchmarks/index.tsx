import { CriteriasProvider } from '@providers/CriteriaProvider'
import { EvaluatorOptionsProvider } from '@providers/EvaluatorOptionsProvider'

import { BenchmarkView } from './BenchmarkView'
import { Landing } from './Landing'
import { BenchmarksProvider } from './Providers/BenchmarksProvider'
import { URLInfoProvider, useURLInfoContext } from './Providers/URLInfoProvider'

const LandingOrBenchmarkView = () => {
  const { benchmark } = useURLInfoContext()

  return benchmark ? <BenchmarkView /> : <Landing />
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
