import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { Loading } from '@carbon/react'

import { useAuthentication } from '@customHooks/useAuthentication'
import { StoredUseCase } from '@prisma/client'
import { get } from '@utils/fetchUtils'
import { getEmptyUseCase, parseFetchedUseCase } from '@utils/utils'

import { PipelineTypesProvider } from './PipelineTypesProvider'
import { SingleExampleEvaluation } from './SingleExampleEvaluation'
import { PipelineType, UseCase } from './types'

export const SingleExampleEvaluationWithProps = () => {
  const [loadingUseCases, setLoadingUseCases] = useState(false)
  const [useCases, setUseCases] = useState<UseCase[] | null>(null)
  const { user, getUserName } = useAuthentication()
  const router = useRouter()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])

  const currentUseCase = useMemo(
    () =>
      useCaseId === null
        ? null
        : useCases !== null
        ? (useCases.find((userUseCase) => userUseCase.id === useCaseId) as UseCase)
        : null,
    [useCases, useCaseId],
  )

  // useEffect(() => {
  //   if (currentUseCase === undefined) {
  //     router.push({ pathname: '/' }, `/`, { shallow: true })
  //   }
  // }, [currentUseCase, router])

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

  if (loadingUseCases || useCases === null) return <Loading withOverlay />

  return (
    <PipelineTypesProvider>
      <SingleExampleEvaluation _userUseCases={useCases} currentUseCase={currentUseCase} />
    </PipelineTypesProvider>
  )
}
