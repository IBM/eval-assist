import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { Loading } from '@carbon/react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { StoredUseCase } from '@prisma/client'
import { parseFetchedUseCase } from '@utils/utils'

import { BackendUserProvider } from './Providers/BackendUserProvider'
import { PipelineTypesProvider } from './Providers/PipelineTypesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'
import { UseCase } from './types'

export const SingleExampleEvaluationWithProps = () => {
  const [loadingUseCases, setLoadingUseCases] = useState(false)
  const [useCases, setUseCases] = useState<UseCase[] | null>(null)
  const { getUserName } = useAuthentication()
  const router = useRouter()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])

  const preloadedUseCase = useMemo(
    () =>
      useCaseId === null
        ? null
        : useCases !== null
        ? (useCases.find((userUseCase) => userUseCase.id === useCaseId) as UseCase)
        : null,
    [useCases, useCaseId],
  )

  const { get } = useFetchUtils()

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
  }, [getUserName, get])

  if (loadingUseCases || useCases === null) return <Loading withOverlay />

  return (
    <PipelineTypesProvider>
      <SingleExampleEvaluation _userUseCases={useCases} preloadedUseCase={preloadedUseCase} />
    </PipelineTypesProvider>
  )
}
