import { GetServerSideProps } from 'next'

import { Strawberry } from '@carbon/react/icons'

import { SingleExampleEvaluation } from '@components/SingleExampleEvaluation'
import { Rubric, UseCase } from '@components/SingleExampleEvaluation/types'
import { TestCase } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'
import { get } from '@utils/fetchUtils'
import { parseFetchedUseCase } from '@utils/utils'

interface Props {
  useCase: UseCase
  savedUseCases: UseCase[]
}

const SavedTestCase = ({ useCase, savedUseCases }: Props) => {
  return <SingleExampleEvaluation useCase={useCase} _savedUseCases={savedUseCases} />
}

export const getServerSideProps = (async (context) => {
  const fetchedUseCase: TestCase = await (await get(`test_case/${context.query.id}`)).json()
  const useCase: UseCase = parseFetchedUseCase(fetchedUseCase)

  const fetchedSavedUseCases: TestCase[] = await (await get(`test_case`)).json()
  const savedUseCases = fetchedSavedUseCases.map((testCase) => parseFetchedUseCase(testCase))
  const result: Props = {
    useCase,
    savedUseCases,
  }

  return { props: result }
}) satisfies GetServerSideProps<Props>

export default SavedTestCase
