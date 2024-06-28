import { Benchmarks } from '@components/Benchmarks'
import { withAuth } from '@components/HOC/withAuth'

const View = () => {
  return <Benchmarks />
}

export default withAuth(View)
