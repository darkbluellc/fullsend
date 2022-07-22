const { execQuery } = require("./db");

const CARRIERS_GET = "SELECT * FROM carriers";

exports.getCarriers = async (pool) => execQuery(pool, CARRIERS_GET, null);

