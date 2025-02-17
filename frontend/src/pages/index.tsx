import { useEffect } from 'react'

import { withAuth } from '@components/HOC/withAuth'
import Landing from '@components/SingleExampleEvaluation/'

const Home = () => {
  useEffect(() => {
    console.warn(
      '⚠ Warning: Sensitive data, such as API keys from third-party providers, is transmitted between the frontend and backend and must be encrypted. Ensure proper TLS termination when deploying the system.',
    )
  }, [])

  return <Landing />
}

export default withAuth(Home)
