import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const model = await prisma.model.create({
      data: {
        name: req.body.name,
        evaluationId: req.body.evaluation_id,
      },
    })
    res.status(200).json({
      id: model.id,
    })
  } else if (req.method === 'DELETE') {
    console.log(req.body)

    const model = await prisma.model.delete({
      where: {
        id: req.body.id,
      },
    })

    res.status(200)
  } else if (req.method === 'PUT') {
    const model = await prisma.model.update({
      where: {
        id: req.body.id,
      },
      data: {
        name: req.body.name,
      },
    })
    res.status(200).json(model)
  }
}
