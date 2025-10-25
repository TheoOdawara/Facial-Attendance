const { Pool } = require('pg');
require('dotenv').config();

/**
 * @type {Pool}
 * @description Pool de conexão com o PostgreSQL.
 */
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

/**
 * Executa uma query no banco de dados.
 * @param {string} text - A string da query SQL.
 * @param {Array<any>} [params] - Os parâmetros para a query.
 * @returns {Promise<import('pg').QueryResult<any>>} O resultado da query.
 */
const query = (text, params) => pool.query(text, params);

module.exports = {
  query
};
