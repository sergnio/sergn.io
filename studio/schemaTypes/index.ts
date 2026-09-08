import { coffeeSchemaTypes } from './coffee'
import { post } from './post'
import { naBeer, reubenReview, wingReview } from './reviews'
import {
  blockContent,
  gallery,
  imageWithAlt,
  money,
  packageSize,
  rating,
} from './shared'

export const schemaTypes = [
  imageWithAlt,
  money,
  packageSize,
  rating,
  gallery,
  blockContent,
  ...coffeeSchemaTypes,
  wingReview,
  naBeer,
  reubenReview,
  post,
]
