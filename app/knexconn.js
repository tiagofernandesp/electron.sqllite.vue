var knexconn = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: "./database.sqlite"
    },
    useNullAsDefault: true
  });
  exports.knex=knexconn;

  //filename: "./resources/app/server/database.sqlite"
  //filename: "./database.sqlite"