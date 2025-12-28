const execQuery = async (pool, q, args = null, db = null) => {
  let conn;
  try {
  conn = await pool.getConnection();
  const dbName = db || process.env.PRIMARY_DB_NAME;
  // Wrap database name in backticks to allow hyphens and other chars.
  // Also escape any backticks that might be present in the name.
  const safeDbName = dbName ? `\`${String(dbName).replace(/`/g, '``')}\`` : null;
  if (safeDbName) await conn.query(`USE ${safeDbName};`);
    const results = await (args != null ? conn.query(q, args) : conn.query(q));
    const response = { success: true };
    if (results) {
      delete results["meta"];
      response.data = convertBigInts(results);
    }
    return response;
  } catch (err) {
    console.error(err);
    return { success: false };
  } finally {
    if (conn) {
      conn.release();
    }
  }
};

// Converts bigInts in an object to ints checking for overflow
const convertBigInts = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === "bigint") {
      if (obj[key] > Number.MAX_SAFE_INTEGER) {
        console.error(`${key} is too large to convert to int`);
        obj[key] = Number.MAX_SAFE_INTEGER;
      } else {
        obj[key] = Number(obj[key]);
      }
    }
  }
  return obj;
};

module.exports = { execQuery };
