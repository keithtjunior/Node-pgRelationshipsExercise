/** BizTime express application. */

const express = require("express");
const app = express();
const ExpressError = require("./expressError");

app.use(express.json());

const coRoutes = require("./routes/companies");
const invRoutes = require("./routes/invoices");

app.use("/companies", coRoutes);
app.use("/invoices", invRoutes);


/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: {
      message: err.message,
      status: err.status
    }
  });
});


module.exports = app;
