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
  reviewMeta,
} from './shared'

export const schemaTypes = [
  imageWithAlt,
  money,
  packageSize,
  rating,
  reviewMeta,
  gallery,
  blockContent,
  ...coffeeSchemaTypes,
  wingReview,
  naBeer,
  reubenReview,
  post,
]
