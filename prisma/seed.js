import { randomUUID } from 'node:crypto'
import prisma from '@prisma/client'

const db = new prisma.PrismaClient()

const sanderson = { id: randomUUID(), name: 'Brandon Sanderson' }
const tolkien = { id: randomUUID(), name: 'J. R. R. Tolkien' }
const pratchett = { id: randomUUID(), name: 'Terry Pratchett' }
const lewis = { id: randomUUID(), name: 'C. S. Lewis' }

const authors = [sanderson, tolkien, pratchett, lewis]

const books = [
  {
    id: randomUUID(),
    title: 'Elantris',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Hope of Elantris',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Final Empire',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Well of Ascension',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Hero of Ages',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Warbreaker',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Way of Kings',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Alloy of Law',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Eleventh Metal',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Emperor’s Soul',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Shadows for Silence in the Forests of Hell',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Words of Radiance',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Allomancer Jak and the Pits of Eltania',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Sixth of the Dusk',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Shadows of Self',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Bands of Mourning',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Secret History',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Edgedancer',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Arcanum Unbounded: The Cosmere Collection',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Oathbringer',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Dawnshard',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Rhythm of War',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Lost Metal',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'Nightblood',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'White Sand, Volume 1',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'White Sand, Volume 2',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'White Sand, Volume 3',
    authorId: sanderson.id
  },
  {
    id: randomUUID(),
    title: 'The Fellowship of the Ring',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'The Two Towers',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'The Return of the King',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'The Adventures of Tom Bombadil and Other Verses from the Red Book',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'Bilbo’s Last Song',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'The Silmarillion',
    authorId: tolkien.id
  },
  {
    id: randomUUID(),
    title: 'The Color of Magic',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'The Light Fantastic',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Equal Rites',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Mort',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Sourcery',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Wyrd Sisters',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Pyramids',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Guards! Guards!',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Eric',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'Moving Pictures',
    authorId: pratchett.id
  },
  {
    id: randomUUID(),
    title: 'The Lion, The Witch and The Wardrobe',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'Prince Caspian',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'The Voyage of the Dawn Treader',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'The Silver Chair',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'The Horse and His Boy',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'The Magician’s Nephew',
    authorId: lewis.id
  },
  {
    id: randomUUID(),
    title: 'The Last Battle',
    authorId: lewis.id
  }
]

await db.author.deleteMany()
await db.book.deleteMany()

await Promise.all(
  authors.map(author => {
    return db.author.create({ data: author })
  })
)

await Promise.all(
  books.map(book => {
    return db.book.create({ data: book })
  })
)
