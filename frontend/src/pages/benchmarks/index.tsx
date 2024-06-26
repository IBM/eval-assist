import { GetStaticProps } from 'next'

import { Benchmarks } from '@components/Benchmarks'
import { withAuth } from '@components/HOC/withAuth'
import { Benchmark } from '@utils/types'

import { benchmarkLibrary } from '../../libraries/benchmarks'

interface Props {
  benchmarkLibrary: Benchmark[]
}

export const getStaticProps = (async () => {
  return { props: { benchmarkLibrary } }
}) satisfies GetStaticProps<Props>

const View = ({ benchmarkLibrary }: Props) => {
  return <Benchmarks benchmarkLibrary={benchmarkLibrary} />
}

export default View
