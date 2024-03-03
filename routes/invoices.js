/** Routes for invoices */

const express = require('express');
const router = new express.Router();

const db = require('../db');
const ExpressError = require('../expressError');


router.get('/', async function(req, res, next) {
    try {
        const results = await db.query('SELECT * FROM invoices');
        return res.json({ invoices: results.rows});
    } catch(err){
        return next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query('SELECT * FROM invoices i JOIN companies c ON c.code = i.comp_code WHERE i.id = $1', [id]);
        if (results.rows.length === 0)
            throw new ExpressError(`Not found: unable to find the requested invoice {${id}}`, 404);
        const { amt, paid, add_date, paid_date, code, name, description } = results.rows[0]
        return res.json({invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}});
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
        return res.status(201).json({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
        let results;
        const { id } = req.params;
        const { amt, paid } = req.body;
        const date = new Date();
        if(typeof paid === 'boolean')
            results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`, [amt, paid, paid ? date.toISOString() : null, id]);
        else 
            results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`, [amt, id]);
        if (results.rows.length === 0)
            throw new ExpressError(`Not found: unable to update invoice with id of {${id}}`, 404);
        return res.json({ invoice: results.rows[0] });
    } catch (e) {
        return next(e);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const select = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (select.rows.length === 0)
            throw new ExpressError(`Not found: unable to delete invoice with id of {${id}}`, 404);
        const results = db.query('DELETE FROM invoices WHERE id = $1', [id]);
        return res.json({ stats: 'deleted' });
    } catch (e) {
        return next(e);
    }
});

router.get('/companies/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies c JOIN invoices i ON i.comp_code = c.code WHERE c.code = $1`, [code]);
        if (results.rows.length === 0)
            throw new ExpressError(`Not found: unable to find the requested company {${code}}`, 404);
        const { name, description } = results.rows[0];
        const invoices = [...Object.values(results.rows.map(d => ({id:d.id, amt:d.amt, paid:d.paid, add_date:d.add_date, paid_date:d.paid_date})))];
        return res.json({company: {code, name, description, invoices: [...invoices]}});
    } catch (e) {
        return next(e);
    }
});

module.exports = router;