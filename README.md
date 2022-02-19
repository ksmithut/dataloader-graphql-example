# DataLoader Example

This is an example repo to explore the utility of the
[`dataloader` library](https://www.npmjs.com/package/dataloader) specifically in
the context of GraphQL.

This GraphQL server exposes two different data types that relate to each other:

1. Books
2. Authors

Each book has an author, and each author has books that they have authored.
Through the GraphQL API, you can query books and their authors, and you can
query authors and their books.

There are two different Apollo Servers running here:

- One that just calls the service methods directly in the resolver
- Another one that has DataLoaders set up to be able to cache different calls
  so that it doesn't make any unecessary database calls.

# Setup

1. Clone this repo
2. Install dependencies
   ```sh
   yarn # or `npm install`
   ```
3. Run database migrations
   ```sh
   yarn prisma migrate reset --force # or `npx prisma migrate reset --force`
   ```
4. Start the server(s)
   ```sh
   yarn start # or `npm start`
   # For dev/watch mode
   yarn dev # or `npm run dev`
   ```
5. Open up the GraphQL Playground for each environment:
   - [Normal Apollo Server](http://localhost:3000)
   - [DataLoader Apollo Server](http://localhost:3001)

# The Problem

GraphQL is all about defining relationships and letting the client get exactly
the fields/relationships that they need in an efficient call. This also allows
the client to query duplicate data over and over. If implemented improperly,
this could be a way for the client to cause a lot of unecessary database load.

For example, in GraphQL, you can query the same resolver under aliases:

```graphql
{
  book1: book(id: "1") {
    id
    title
  }
  book2: book(id: "1") {
    id
    title
  }
}
```

In a naïve implementation, the GraphQL server would just make two database calls
for the same book. This can get worse if you make a more expensive database
call:

```graphql
{
  books {
    id
    title
    author {
      id
      name
    }
  }
}
```

Here we're querying all books, then for each book we are querying the author.
Without DataLoader (or something like it) we could be querying the same author
many times.

To illustrate the issue, make sure your server is running with `yarn start` or
`yarn dev`, then visit the non-dataloader Apollo Server by going to
[locahost:3000](http://localhost:3000). Now copy in the following query:

```graphql
{
  books {
    id
    title
    author {
      id
      name
    }
  }
}
```

Pay attention to the logs after you run it. Note that each log line represents a
separate database call. What did you notice?

Now let's make it worse with just a few extra lines:

```graphql
{
  books {
    id
    title
    author {
      id
      name
      books {
        id
        title
        author {
          id
          name
        }
      }
    }
  }
}
```

Pay attention to the logs as you run it. See any problems with this?

Enter [DataLoader](https://www.npmjs.com/package/dataloader).

> DataLoader is a generic utility to be used as part of your application's data
> fetching layer to provide a simplified and consistent API over various remote
> data sources such as databases or web services via batching and caching.

To create a DataLoader, you just need a function that takes in an array of keys
and returns an array of objects that map up to those ids.

```js
const users = {
  '1': { username: 'test' },
  '2': { username: 'foo' },
  '3': { username: 'bar' }
}
const userLoader = new DataLoader(async function (ids) {
  return ids.map(id => users[id])
})
```

Now if I load data from the DataLoader, it can be cached and batched up so that
the function only needs to be called once. For example:

```js
const user1 = await userLoader.load('1')
const user1Duplicate = await userLoader.load('1')
```

The above code will call the function you passed into the `DataLoader()`
constructor only once even though you called `.load()` twice. The way this works
under the hood is this:

```js
const user1 = await userLoader.load('1')
```

This will call your loader function internally like this:
`internalLoaderFunction(['1'])` and your function will return an array of
one item: `[{ username: 'test' }]`. The DataLoader will also keep a cache of
this, so if you call `.load('1')` on the loader again, it will just return the
value you returned last time with that id.

Now if you were to call `.load()` on two different ids at the same time, it will
batch them up so your loader function only gets called once. For example:

```js
userLoader.load('1')
userLoader.load('2')
userLoader.load('3')
userLoader.load('1')
```

Those will all get loaded up into a single call to your loader, so your loader
is called with this: `internalLoaderFunction(['1', '2', '3'])` and your function
will return an array of three items:
`[{ username: 'test' }, { username: 'foo' }, { username: 'bar' }]`. Notice how
it didn't pass in an extra `1` at the end. DataLoader will make sure your batch
function only gets called with each key once. Now the dataloader will have
cached users with the ids `1`, `2`, and `3`.

For HTTP APIs, we could create global DataLoader for each data type. The problem
with caches, though is that you have to keep them updated. DataLoaders make a
lot more sense in HTTP APIs when they only live for the lifetime of the request.
So in our case, we want to create new DataLoaders at the beginning of the
request, then use those DataLoader instances in your request handlers.

Enter GraphQL.

In GraphQL, you have your **type definitions** and your **resolvers**. You
define your types, and the resolvers (functions) that match up to those types
and fields. In ApolloServer, you can setup your GraphQL **context**, which gets
passed to every resolver.

```js
import { ApolloServer, gql } from 'apollo-server'

const typeDefs = gql`
  type Person {
    id: ID!
  }
  type Query {
    viewer: Person
  }
`

const resolvers = {
  Query: {
    viewer (_parent, _args, ctx) {
      return ctx.user
    }
  }
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  async context ({ req, res }) {
    return {
      user: { id: '123' }
    }
  }
})
```

So whatever we return from the `context()` method in the ApolloServer
constructor is what becomes available in all of the resolvers as the third
argument. This `context()` method gets called exactly once per request, so any
new objects we initialize there will be isolated to that HTTP request. This
makes it perfect for our use case in GraphQL because we want to be able to cache
(and batch) calls to load individual objects, then when the request is done we
throw the cache away.

So if we had a real database we wanted to batch up calls to, we could initialize
a DataLoader for it like this:

```js
import { ApolloServer, gql } from 'apollo-server'
import DataLoader from 'dataloader'
import _ from 'lodash'
import db from './db.js'

/**
 * @param {readonly string[]}
 */
function batchLoadTodosById (ids) {
  const todos = await db.todo.findMany({
    where: { id: { in: ids.slice() } }
  })
  const todosById = _.keyBy(todos, 'id')
  // We need to make sure that the objects
  // we return are in the same order as the
  // ids. This is so DataLoader caches the
  // correct object with the correct id.
  return ids.map(id => todosById[id])
}

const typeDefs = gql`
  type Todo {
    id: ID!
    label: String!
    completed: Boolean!
  }
  type Query {
    todo(id: ID!): Todo
  }
`

const resolvers = {
  Query: {
    todo (_parent, args, ctx) {
      return ctx.todosById.load(args.id)
    }
  }
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  async context ({ req, res, }) {
    return {
      todosById: new DataLoader(batchLoadTodosById)
    }
  }
})
```

Now if someone makes a GraphQL call like this:

```graphql
{
  todo(id: "1") {
    id
    label
  }
  todo(id: "2") {
    id
    label
  }
  todo(id: "3") {
    id
    label
  }
  todo(id: "1") {
    id
    label
  }
}
```

our `batchLoadTodosById()` function only gets called once with three different
ids.

In the code included in this codebase we use some more advanced features of
DataLoader, such as **priming** and changing the key used in the **cache**. I'll
leave that as an exercise to the reader to figure out what those do.

Now that you've had an introduction to DataLoader and DataLoader in
ApolloServer, go to the DataLoader version of the Book/Author API by
opening up [localhost:3001](http://localhost:3001) and running the queries from
before. Be sure to pay attention to the log lines produced by these queries:

```graphql
{
  books {
    id
    title
    author {
      id
      name
    }
  }
}
```

```graphql
{
  books {
    id
    title
    author {
      id
      name
      books {
        id
        title
        author {
          id
          name
        }
      }
    }
  }
}
```

Notice a difference? That is what DataLoader is doing for us. Batching and
caching so that we hopefully never query the same database record twice.

# Notes

- DataLoader is not a substitute for proper **rate limiting**. DataLoader
  doesn't prevent an API call from querying too much from your database, just
  from querying the same item twice (in some cases).
- You usually need a new DataLoader for every way you can query your database
  objects. For example, in this codebase you can query books by `id` and also by
  `authorId`. We need two different DataLoaders because the database functions
  we call in those cases are different. When we query books by id we give an
  `id` and we get back a book. When we query books by `authorId` we give an
  `authorId` and get back an array of books.
- It's usually not practical to use a DataLoader for dynamic filtering/paginated
  results. This is because DataLoader needs to key by something, and in those
  cases the key would need to be some string representation of the whole query
  with field filters and pagination parameters and all. This is not usually
  something that you would happen to query twice. However, you could use the
  results of that query to prime the other DataLoaders.
- Just in case it wasn't clear, DataLoaders are for Queries, not Mutations. You
  don't want to cache creating or changing an object. Imagine sending in a
  mutation to create two new objects that look exactly the same. The intent is
  to create two distinct objects, but if you put it behind a DataLoader, you
  would only create one. You could turn off the caching, but then you wouldn't
  get any of the batching benefits because mutations run serially (one at a
  time). It would still only call your loader function for each item, completely
  removing the benefit of what DataLoader provides.

> **Fun Fact!** The SQLite database we seed with authors and books is around
> 36K. The `yarn.lock` file is 68K.
