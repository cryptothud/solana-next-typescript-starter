// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { middlewares } from '../../scripts/helpers'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  //rate limits the api
  try {
    await Promise.all(
      middlewares.map(middleware => middleware(req, res))
    )
  } catch {
    return res.status(429).send('Too many requests')
  }

  res.status(200).json({ name: 'John Doe' })
}
