import { withAuth } from '@components/HOC/withAuth'
import Landing from '@components/SingleExampleEvaluation/'

const Home = () => {
  return <Landing />
}

export default withAuth(Home)
