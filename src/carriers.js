const { execQuery } = require("./db");

const CARRIERS_GET = "SELECT * from carriers";

exports.getCarriers = (pool) =>
  execQuery(pool, CARRIERS_GET, null, (results) => {
    delete results["meta"];
    return results;
  });
