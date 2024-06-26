import { benchmarkLibrary } from 'src/libraries/benchmarks'

import type { NextApiRequest, NextApiResponse } from 'next'

import { Benchmark } from '@utils/types'

type ResponseData = Benchmark[]

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  return res.status(200).json(benchmarkLibrary)
}
