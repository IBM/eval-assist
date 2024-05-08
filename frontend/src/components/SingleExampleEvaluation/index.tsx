import { useEffect, useState } from 'react'

import { useRouter } from 'next/router'

import { Loading } from '@carbon/react'

import { withAuth } from '@components/HOC/withAuth'
import { useAuthentication } from '@customHooks/useAuthentication'
import { StoredUseCase } from '@prisma/client'
import { get } from '@utils/fetchUtils'
import { parseFetchedUseCase } from '@utils/utils'

import { SingleExampleEvaluation } from './SingleExampleEvaluation'
import { UseCase } from './types'

const SingleExampleEvaluationWithProps = () => {
  const [loading, setLoading] = useState(false)
  const [useCases, setUseCases] = useState<UseCase[] | null>(null)
  const { user, getUserName } = useAuthentication()

  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true)
      const fetchedUserUseCases: StoredUseCase[] = await (
        await get(`use_case/?user=${encodeURIComponent(getUserName())}`)
      ).json()
      const userUseCases = fetchedUserUseCases.map((testCase) => parseFetchedUseCase(testCase))
      setUseCases(userUseCases)
      setLoading(false)
    }
    fetchProps()
  }, [getUserName])

  if (loading || useCases === null) return <Loading withOverlay />

  return <SingleExampleEvaluation _userUseCases={useCases} />
}

export const EvaluationLandingPage = withAuth(SingleExampleEvaluationWithProps)
