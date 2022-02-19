import _ from 'lodash'
import db from './db.js'

/**
 * @param {string} authorId
 */
export async function loadAuthorById (authorId) {
  console.log(`loadAuthorById(${JSON.stringify(authorId)})`)
  return db.author.findUnique({ where: { id: authorId } })
}

export async function loadAuthors () {
  console.log(`loadAuthors()`)
  return db.author.findMany()
}

/**
 * @param {readonly string[]} authorIds
 */
export async function batchLoadAuthorById (authorIds) {
  console.log(`batchLoadAuthorById(${JSON.stringify(authorIds)})`)
  const authors = await db.author.findMany({
    where: { id: { in: authorIds.slice() } }
  })
  const authorsById = _.keyBy(authors, 'id')
  return authorIds.map(authorId => authorsById[authorId])
}
