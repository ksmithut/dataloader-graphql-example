import _ from 'lodash'
import db from './db.js'

/**
 * @param {string} bookId
 */
export async function loadBookById (bookId) {
  console.log(`loadBookById(${JSON.stringify(bookId)})`)
  return db.book.findUnique({ where: { id: bookId } })
}

export async function loadBooks () {
  console.log('loadBooks()')
  return db.book.findMany()
}

/**
 * @param {string} authorId
 */
export async function loadBooksByAuthorId (authorId) {
  console.log(`loadBooksByAuthorId(${JSON.stringify(authorId)})`)
  return db.book.findMany({ where: { authorId } })
}

/**
 * @param {readonly string[]} bookIds
 */
export async function batchLoadBookById (bookIds) {
  console.log(`batchLoadBookById(${JSON.stringify(bookIds)})`)
  const books = await db.book.findMany({
    where: { id: { in: bookIds.slice() } }
  })
  const booksById = _.keyBy(books, 'id')
  return bookIds.map(bookId => booksById[bookId])
}

/**
 * @param {readonly string[]} authorIds
 */
export async function batchLoadBooksByAuthorId (authorIds) {
  console.log(`batchLoadBooksByAuthorId(${JSON.stringify(authorIds)})`)
  const books = await db.book.findMany({
    where: { authorId: { in: authorIds.slice() } }
  })
  const booksByAuthorId = _.groupBy(books, 'authorId')
  return authorIds.map(authorId => booksByAuthorId[authorId] ?? [])
}
