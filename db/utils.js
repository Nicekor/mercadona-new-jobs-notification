const db = require('../db');

const cleanTable = (tableName, res) => {
  try {
    const sql = `TRUNCATE TABLE ${tableName};`;
    db.query(sql, (err, results) => {
      if (err) throw err;
    });
  } catch (err) {
    res.sendStatus(500);
    console.error(err);
  }
};

module.exports = { cleanTable };
