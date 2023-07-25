// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  doc,
  getDoc
} from "firebase/firestore";
import { db } from './firebase';
import { middlewares } from './helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  try {
    await Promise.all(
      middlewares.map(middleware => middleware(req, res))
    )
  } catch {
    return res.status(429).send('Too many requests')
  }

  const requestData = req.body
  const request = requestData.request

  if (request === "getXPBalance") {
    const foundUser = await getDoc(doc(db, "users", requestData.wallet))
    if (foundUser.exists()) {
      res.status(200).json({ result: foundUser?.data().xp });
    } else {
      res.status(200).json({ result: 0 });
    }
  }

}
