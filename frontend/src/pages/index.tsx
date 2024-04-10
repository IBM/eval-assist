import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

import { LandingPage } from '@components/LandingPage/LandingPage'
import { get } from '@utils/fetchUtils'

interface Props {
  fetchedEvaluations: any[]
}

const Home = ({ fetchedEvaluations }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return <LandingPage fetchedEvaluations={fetchedEvaluations} />
}

export const getServerSideProps = (async () => {
  // TODO: find out how to solve Date being converted to string
  // it happens when next server gets date from the api
  // and when client gets dates from next server

  const fetchedEvaluations: any[] = await (await get('evaluation')).json()
  fetchedEvaluations.forEach((e) => (e.created_at = new Date(e.created_at)))
  fetchedEvaluations.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

  const result: Props = {
    fetchedEvaluations: JSON.parse(JSON.stringify(fetchedEvaluations)),
  }

  return {
    props: {
      ...result,
    },
  }
}) satisfies GetServerSideProps<Props>

export default Home
