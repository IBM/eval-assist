import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const evaluation = await prisma.evaluation.create({
      data: {
        ...req.body,
      },
    })
    res.status(200).json(evaluation)
  } else if (req.method === 'PUT') {
    const { evaluation_id, ...rest } = req.body
    const evaluation = await prisma.evaluation.update({
      where: {
        id: evaluation_id,
      },
      data: {
        ...rest,
      },
    })
    res.status(200).json(evaluation)
  } else if (req.method === 'DELETE') {
    const { id } = req.body

    const result = await prisma.$transaction(async (tx) => {
      const evaluation = await prisma.evaluation.findUnique({
        where: {
          id: id,
        },
        include: {
          run: true,
        },
      })

      if (evaluation?.run) {
        const contests = await prisma.contest.deleteMany({
          where: {
            runId: evaluation.run.id,
          },
        })

        const examples = await prisma.example.findMany({
          where: {
            runId: evaluation.run.id,
          },
        })

        // Delete review
        const review = await prisma.review.findFirst({
          where: {
            evaluationId: evaluation.id,
          },
        })

        if (review) {
          await prisma.reviewExample.deleteMany({
            where: {
              reviewId: review.id,
            },
          })

          await prisma.review.delete({
            where: {
              id: review.id,
            },
          })
        }

        await prisma.output.deleteMany({
          where: {
            exampleId: {
              in: examples.map((a) => a.id),
            },
          },
        })

        await prisma.example.deleteMany({
          where: {
            runId: evaluation.run.id,
          },
        })

        await prisma.run.delete({
          where: {
            id: evaluation.run.id,
          },
        })
      }

      if (evaluation) {
        await prisma.model.deleteMany({
          where: {
            evaluationId: evaluation.id,
          },
        })
      }

      await prisma.evaluation.delete({
        where: {
          id: evaluation?.id,
        },
      })

      return {}
    })

    res.status(200).json(result)
  }
}
