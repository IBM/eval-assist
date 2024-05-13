import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { Loading } from '@carbon/react'

import { withAuth } from '@components/HOC/withAuth'
import { useAuthentication } from '@customHooks/useAuthentication'
import { StoredUseCase } from '@prisma/client'
import { get } from '@utils/fetchUtils'
import { getEmptyUseCase, parseFetchedUseCase } from '@utils/utils'

import { SingleExampleEvaluation } from './SingleExampleEvaluation'
import { UseCase } from './types'

const SingleExampleEvaluationWithProps = () => {
  const [loadingUseCases, setLoadingUseCases] = useState(false)
  const [useCases, setUseCases] = useState<UseCase[] | null>(null)
  const { user, getUserName } = useAuthentication()
  const router = useRouter()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])

  const currentUseCase = useMemo(
    () =>
      useCaseId === null
        ? getEmptyUseCase()
        : useCases !== null
        ? (useCases.find((userUseCase) => userUseCase.id === useCaseId) as UseCase)
        : null,
    [useCases, useCaseId],
  )

  useEffect(() => {
    const fetchUseCases = async () => {
      setLoadingUseCases(true)
      const fetchedUserUseCases: StoredUseCase[] = await (
        await get(`use_case/?user=${encodeURIComponent(getUserName())}`)
      ).json()
      const userUseCases = fetchedUserUseCases.map((testCase) => parseFetchedUseCase(testCase))
      setUseCases(userUseCases)
      setLoadingUseCases(false)
    }
    fetchUseCases()
  }, [getUserName])

  if (loadingUseCases || useCases === null || currentUseCase === null) return <Loading withOverlay />

  return <SingleExampleEvaluation _userUseCases={useCases} currentUseCase={currentUseCase} />
}

export const EvaluationLandingPage = withAuth(SingleExampleEvaluationWithProps)
