import { useState } from 'react'

import { useFetchUtils } from './useFetchUtils'

interface Props {}

export const useGenerateSystheticExamples = ({}: Props) => {
  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const { post } = useFetchUtils()

  const fetchSystheticExamples = async () => {
    const body = {}
    const syntheticExamples = (await (await post('synthetic-examples/', body)).json())['systhetic_examples']
    return syntheticExamples
  }

  return { fetchSystheticExamples }
}
