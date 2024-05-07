import { GetServerSideProps } from 'next'

import { SingleExampleEvaluation } from '@components/SingleExampleEvaluation'
import { UseCase } from '@components/SingleExampleEvaluation/types'
import { StoredUseCase } from '@prisma/client'
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
  const fetchedUseCase: StoredUseCase = await (await get(`test_case/${context.query.id}`)).json()
  const useCase: UseCase = parseFetchedUseCase(fetchedUseCase)

  const fetchedSavedUseCases: StoredUseCase[] = await (await get(`test_case`)).json()
  const savedUseCases = fetchedSavedUseCases.map((testCase) => parseFetchedUseCase(testCase))
  const result: Props = {
    useCase,
    savedUseCases,
  }

  return { props: result }
}) satisfies GetServerSideProps<Props>

export default SavedTestCase
