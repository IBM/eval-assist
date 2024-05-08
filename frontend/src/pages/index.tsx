import { ClientOnly } from '@components/ClientOnly/ClientOnly'
import { EvaluationLandingPage } from '@components/SingleExampleEvaluation'

const Home = () => {
  return (
    <ClientOnly>
      <EvaluationLandingPage />
    </ClientOnly>
  )
}

export default Home
