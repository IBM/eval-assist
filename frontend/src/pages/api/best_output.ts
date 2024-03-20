import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const reviewExampleId = req.body.reviewExampleId
    const bestOutputId = req.body.bestOutputId

    const reviewExample = await prisma.reviewExample.update({
      where: {
        id: reviewExampleId,
      },
      data: {
        bestOutputId: bestOutputId,
        complete: true,
      },
    })

    res.status(200).json(reviewExample)
  }
}
