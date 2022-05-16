process.env.NODE_ENV = "test";

const request = require("supertest");
const db = require("../db")
const Book = require("../models/book");
const app = require("../app");

let testBook;

beforeEach(async () => {
    const result = await db.query(
        `INSERT INTO books
        (isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING  isbn,
        amazon_url,
        author,
        language,
        pages,
        publisher,
        title,
        year`,
        ["0691161518", "http://a.co/eobPtX2", "Matthew Lane", "english", 264, "Princeton University Press", "Power-Up: Unlocking the Hidden Mathematics in Video Games", 2017])

    testBook = result.rows[0];
})

describe("GET /books", () =>{
    test('should return a list of books', async () =>{
        const result = await request(app).get("/books");
        expect(result.statusCode).toBe(200);
        expect(result.body).toEqual({books: [testBook]})
    })
})

describe("GET /:id", () => {
    test('should return a single book', async () => {
        const results = await request(app).get(`/books/${testBook.isbn}`);
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({book: testBook});
    })
    test('should return no isbn error', async () => {
        const results = await request(app).get(`/books/bad`);
        expect(results.statusCode).toBe(404);
        expect(results.body).toEqual({
            error: {
                message: "There is no book with an isbn 'bad",
                status: 404
            },
            message: "There is no book with an isbn 'bad"
        });
    })
})

describe("POST /", () => {
    test("should create a new book and return it", async () => {
        const result = await request(app)
        .post("/books")
        .send({
            "isbn": "0691118",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })
        expect(result.statusCode).toBe(201);
        expect(result.body).toEqual({
            book: {
                "isbn": "0691118",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "english",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            }
        });
    })
    test('should return a validation error', async () => {
        const result = await request(app)
        .post("/books")
        .send({
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })
        expect(result.statusCode).toBe(400);
        expect(result.body).toEqual({
            error: {
                message: ["instance requires property \"isbn\""],
                status: 400
            },
            message: ["instance requires property \"isbn\""]
        })
    })
})

describe("PUT /books:isbn", () => {
    test('should return updated book', async () => {
        const results = await request(app)
        .put(`/books/${testBook.isbn}`)
        .send({
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "german",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2020
        })
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({
            book: {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "language": "german",
                "pages": 264,
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2020
            }
            
        })
    })
    test('should return a validation error', async () => {
        const result = await request(app)
        .put("/books/bad")
        .send({
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        })
        expect(result.statusCode).toBe(404);
        expect(result.body).toEqual({
            error: {
                message: "There is no book with an isbn 'bad",
                status: 404
            },
            message: "There is no book with an isbn 'bad"
        });
    })
})

describe("DELETE /books/:isbn", () => {
    test('should return a deleted message', async () => {
        const results = await request(app).delete(`/books/${testBook.isbn}`);
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({message: "Book deleted"});
    });
    test('should return a validation error', async () => {
        const result = await request(app).delete("/books/bad")
        expect(result.statusCode).toBe(404);
        expect(result.body).toEqual({
            error: {
                message: "There is no book with an isbn 'bad",
                status: 404
            },
            message: "There is no book with an isbn 'bad"
        });
    })

})


afterEach(async () => {
    await db.query(`DELETE FROM books`);
})

afterAll(async () => {
    await db.end();
})