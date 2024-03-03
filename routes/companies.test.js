process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let co;

beforeEach(async () => {
  const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('google', 'Google', 'Developers of Chrome') RETURNING *`);
  co = result.rows[0];
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
})

afterAll(async () => {
  await db.end();
})

describe("GET /companies", () => {
  test("get a list of companies", async () => {
    const res = await request(app).get('/companies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ companies: [co] });
  });
})

describe("GET /companies/:code", () => {
  test("get a single company", async () => {
    const res = await request(app).get(`/companies/${co.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: co });
  });
  test("responds 404 for invalid company code", async () => {
    const res = await request(app).get(`/companies/0`);
    expect(res.statusCode).toBe(404);
  });
})

describe("POST /companies", () => {
  test("create a company", async () => {
    const res = await request(app).post('/companies').send({ code: 'nvidia', name: 'Nvidia', description: 'Developers of GeForce graphics cards'});
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: 'nvidia', name: 'Nvidia', description: 'Developers of GeForce graphics cards' }
    });
  });
})

describe("PUT /companies/:code", () => {
  test("updates a company", async () => {
    const res = await request(app).put(`/companies/${co.code}`).send({ name: 'Google LLC', description: 'Makers of Chrome' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
        company: { code: 'google', name: 'Google LLC', description: 'Makers of Chrome' }
    });
  });
  test("responds 404 for invalid company code", async () => {
    const res = await request(app).patch(`/companies/0`).send({ name: 'Google LLC', description: 'Makers of Chrome' });
    expect(res.statusCode).toBe(404);
  });
})

describe("DELETE /companies/:code", () => {
  test("deletes a company", async () => {
    const res = await request(app).delete(`/companies/${co.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ stats: 'deleted' })
  });
})


