/** Routes for companies */

const express = require('express');
const router = new express.Router();
const slugify = require('slugify');

const db = require('../db');
const ExpressError = require('../expressError');

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query('SELECT * FROM companies');
        return res.json({ companies: results.rows});
    } catch(err){
        return next(err);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query('SELECT * FROM companies WHERE code = $1', [code]);
        if (results.rows.length === 0)
            throw new ExpressError(`Not found: unable to find the requested company {${code}}`, 404);
        return res.json({ company: results.rows[0] });
    } catch (e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = req.body.code || slugify(name, {lower:true, strict:true});
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
        return res.status(201).json({ company: results.rows[0] });
    } catch (e) {
        return next(e);
    }
  });

  router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *', [name, description, code]);
        if (results.rows.length === 0)
            throw new ExpressError(`Not found: unable to update company with code of {${code}}`, 404);
        return res.json({ company: results.rows[0] });
    } catch (e) {
        return next(e);
    }
  });

  router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const select = await db.query('SELECT * FROM companies WHERE code = $1', [code]);
        if (select.rows.length === 0)
            throw new ExpressError(`Not found: unable to delete company with code of {${code}}`, 404);
        const results = db.query('DELETE FROM companies WHERE code = $1', [code]);
        return res.json({ stats: 'deleted' });
    } catch (e) {
        return next(e);
    }
  });

module.exports = router;