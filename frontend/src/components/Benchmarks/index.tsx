import { CriteriasProvider } from '@components/SingleExampleEvaluation/Providers/CriteriasProvider'
import { EvaluatorOptionsProvider } from '@components/SingleExampleEvaluation/Providers/EvaluatorOptionsProvider'

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
