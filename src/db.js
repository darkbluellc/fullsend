const execQuery = async (
  pool,
  q,
  args = null,
  responseFunc = null,
  db = null
) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`USE ${db || process.env.PRIMARY_DB_NAME};`);
    const results = await (args != null ? conn.query(q, args) : conn.query(q));
    const response = { success: true };
    if (responseFunc != null) {
      response.data = responseFunc(results);
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

module.exports = { execQuery };
