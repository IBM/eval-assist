import { BackendUserProvider } from './Providers/BackendUserProvider'
import { SingleExampleEvaluationWithProps } from './SingleExampleEvaluationWithProps'

const Landing = () => (
  <BackendUserProvider>
    <SingleExampleEvaluationWithProps />
  </BackendUserProvider>
)

export default Landing
