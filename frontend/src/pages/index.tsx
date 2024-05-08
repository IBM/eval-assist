// import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
// import { LandingPage } from '@components/LandingPage/LandingPage'
import { use } from 'react'

import { GetServerSideProps } from 'next'
import { useSession } from 'next-auth/react'

import { SingleExampleEvaluation } from '@components/SingleExampleEvaluation'
import { UseCase } from '@components/SingleExampleEvaluation/types'
import { useAuthentication } from '@customHooks/useAuthentication'
import { StoredUseCase } from '@prisma/client'
import { get } from '@utils/fetchUtils'
import { parseFetchedUseCase } from '@utils/utils'

import { LoginView } from '../components/Login/Login'

interface Props {
  savedUseCases: UseCase[]
}

const Home = ({ savedUseCases }: Props) => {
  const { authenticationEnabled, isAuthenticated, user } = useAuthentication()

  if (authenticationEnabled && !isAuthenticated) {
    return <LoginView></LoginView>
  } else {
    return <SingleExampleEvaluation _savedUseCases={savedUseCases} />
  }
}

export const getServerSideProps = (async (context) => {
  const fetchedSavedUseCases: StoredUseCase[] = await (await get(`test_case`)).json()
  const savedUseCases = fetchedSavedUseCases.map((testCase) => parseFetchedUseCase(testCase))
  const result: Props = {
    savedUseCases,
  }

  return { props: result }
}) satisfies GetServerSideProps<Props>

// export const getServerSideProps = (async () => {
//   // TODO: find out how to solve Date being converted to string
//   // it happens when next server gets date from the api
//   // and when client gets dates from next server

//   const fetchedEvaluations: any[] = await (await get('evaluation')).json()
//   fetchedEvaluations.forEach((e) => (e.created_at = new Date(e.created_at)))
//   fetchedEvaluations.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())

//   const result: Props = {
//     fetchedEvaluations: JSON.parse(JSON.stringify(fetchedEvaluations)),
//   }

//   return {
//     props: {
//       ...result,
//     },
//   }
// }) satisfies GetServerSideProps<Props>

export default Home
