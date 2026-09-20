import { coffeeSchemaTypes } from './coffee'
import { post } from './post'
import { callout, codeBlock, divider, postBody } from './postBody'
import { naBeer, reubenReview, syrupReview, wingReview } from './reviews'
import { blockContent, grade, imageWithAlt, money, packageSize } from './shared'

export const schemaTypes = [
  imageWithAlt,
  money,
  packageSize,
  grade,
  blockContent,
  callout,
  codeBlock,
  divider,
  postBody,
  ...coffeeSchemaTypes,
  wingReview,
  naBeer,
  reubenReview,
  syrupReview,
  post,
]
