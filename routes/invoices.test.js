process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

let inv;
let co;

beforeEach(async () => {
  const res = await db.query(`INSERT INTO companies (code, name, description) VALUES ('google', 'Google', 'Developers of Chrome') RETURNING *`);
  co = res.rows[0];
  const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('google', '${500}') RETURNING *`);
  inv = result.rows[0];
})

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
})

afterAll(async () => {
  await db.end();
})

describe("GET /invoices", () => {
  test("get a list of invoices", async () => {
    const res = await request(app).get('/invoices');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoices: [{...inv, add_date:expect.any(String)}] });
    expect(3).toEqual(3);
  });
})

describe("GET /invoices/:id", () => {
  test("get a single invoice", async () => {
    const res = await request(app).get(`/invoices/${inv.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoice: { add_date:expect.any(String), amt:inv.amt, id:expect.any(String), paid:false, paid_date:null, company: co }});
  });
  test("responds 404 for invalid invoice code", async () => {
    const res = await request(app).get(`/invoices/0`);
    expect(res.statusCode).toBe(404);
  });
})

describe("POST /invoices", () => {
  test("create a invoice", async () => {
    const res = await request(app).post('/invoices').send({ comp_code: 'google', amt: 800 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: { id:expect.any(Number), amt:expect.any(Number), comp_code:'google', paid:false, add_date:expect.any(String), paid_date:null }});
  });
})

describe("PUT /invoices/:id", () => {
  test("updates an invoice amount", async () => {
    const res = await request(app).put(`/invoices/${inv.id}`).send({ amt: 1000 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoice: { ...inv, add_date:expect.any(String), amt:expect.any(Number) } });
  });
  test("updates an invoice amount and if paid", async () => {
    const res = await request(app).put(`/invoices/${inv.id}`).send({ amt: 1000, paid: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ invoice: { id:expect.any(Number), amt: 1000, comp_code:co.code, paid:true, paid_date:expect.any(String), add_date:expect.any(String) } });
  });
  test("responds 404 for invalid invoice code", async () => {
    const res = await request(app).patch(`/invoices/0`).send({ amt: 1000 });
    expect(res.statusCode).toBe(404);
  });
})

describe("DELETE /invoices/:id", () => {
  test("deletes a invoice", async () => {
    const res = await request(app).delete(`/invoices/${inv.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ stats: 'deleted' })
  });
})

describe("GET /invoices/companies/:code", () => {
  test("get a single company with all associated invoices", async () => {
    const res = await request(app).get(`/invoices/companies/${co.code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: {code:expect.any(String), name:expect.any(String), description:expect.any(String), invoices: [{ add_date:expect.any(String), amt:inv.amt, id:expect.any(Number), paid:false, paid_date:null }]}});
  });
  test("responds 404 for invalid invoice code", async () => {
    const res = await request(app).get(`/invoices/companies/0`);
    expect(res.statusCode).toBe(404);
  });
})


