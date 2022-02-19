import { ApolloServer, gql } from 'apollo-server'
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'
import DataLoader from 'dataloader'
import * as authorService from './authors.js'
import * as bookService from './books.js'

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    authorId: String
    author: Author
  }

  type Query {
    book(id: ID!): Book
    books: [Book!]!
    author(id: ID!): Author
    authors: [Author!]!
  }
`

const resolvers = {
  Query: {
    book (_parent, args, _ctx) {
      return bookService.loadBookById(args.id)
    },
    author (_parent, args, _ctx) {
      return authorService.loadAuthorById(args.id)
    },
    books (_parent, _args, _ctx) {
      return bookService.loadBooks()
    },
    authors (_parent, _args, _ctx) {
      return authorService.loadAuthors()
    }
  },
  Book: {
    author (book, _args, _ctx) {
      return book.authorId ? authorService.loadAuthorById(book.authorId) : null
    }
  },
  Author: {
    books (author, _args, _ctx) {
      return bookService.loadBooksByAuthorId(author.id)
    }
  }
}

const dataLoaderResolvers = {
  Query: {
    book (_parent, args, ctx) {
      return ctx.booksById.load(args.id)
    },
    author (_parent, args, ctx) {
      return ctx.authorsById.load(args.id)
    },
    books (_parent, _args, ctx) {
      return ctx.books.load({})
    },
    authors (_parent, _args, ctx) {
      return ctx.authors.load({})
    }
  },
  Book: {
    author (book, _args, ctx) {
      return book.authorId ? ctx.authorsById.load(book.authorId) : null
    }
  },
  Author: {
    books (author, _args, ctx) {
      return ctx.booksByAuthorId.load(author.id)
    }
  }
}

/**
 * @param {object} params
 * @param {import('node:http').IncomingMessage} params.req
 * @param {import('node:http').ServerResponse} params.res
 */
async function context ({ req, res }) {
  const booksById = new DataLoader(bookService.batchLoadBookById)
  const authorsById = new DataLoader(authorService.batchLoadAuthorById)
  const booksByAuthorId = new DataLoader(async authorIds => {
    const bookGroups = await bookService.batchLoadBooksByAuthorId(authorIds)
    bookGroups.flat().forEach(book => booksById.prime(book.id, book))
    return bookGroups
  })
  const books = new DataLoader(
    async keys => {
      const books = await bookService.loadBooks()
      books.forEach(book => booksById.prime(book.id, book))
      return keys.map(() => books)
    },
    { cacheKeyFn: () => true }
  )
  const authors = new DataLoader(
    async keys => {
      const authors = await authorService.loadAuthors()
      authors.forEach(author => authorsById.prime(author.id, author))
      return keys.map(() => authors)
    },
    { cacheKeyFn: () => true }
  )
  return {
    booksById,
    authorsById,
    booksByAuthorId,
    books,
    authors
  }
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context
})
const dataLoaderApolloServer = new ApolloServer({
  typeDefs,
  resolvers: dataLoaderResolvers,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context
})

const { url } = await apolloServer.listen(3000)
console.log(`Apollo Server ready at ${url}`)

const { url: dataLoaderUrl } = await dataLoaderApolloServer.listen(3001)
console.log(`DataLoader Apollo Server ready at ${dataLoaderUrl}`)

console.log()
