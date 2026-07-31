require("dotenv").config();

const mysql = require("mysql2");

console.log("HOST:", process.env.DB_HOST);
console.log("PORT:", process.env.DB_PORT);
console.log("USER:", process.env.DB_USER);
console.log("DB:", process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Error conexión:", err);
    return;
  }

  console.log("✅ Conectado a Railway");

  connection.query("SELECT NOW()", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log(rows);
    }

    connection.end();
  });
});