const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const app = express();

/* =========================
   ✅ CONFIGURACIÓN CORS
   ========================= */
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // Responder preflight inmediatamente
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// 👉 Manejar preflight requests

app.use(express.json());

/* =========================
   ✅ CONEXIÓN A MYSQL
   ========================= */
const db = mysql.createPool({
  host: 'sql3.freesqldatabase.com',
  user: 'sql3771895',
  password: 'hy4ta1yPug',
  database: 'sql3771895',
  port: 3306
});

/* =========================
   ✅ RUTA DE REGISTRO
   ========================= */
app.post('/registro', async (req, res) => {
  console.log('📩 Datos recibidos:', req.body);

  const {
    Nombre,
    Apaterno,
    Amaterno,
    Fechanac,
    Sexo,
    Email,
    Pais,
    Ciudad,
    Contrasena
  } = req.body;

  if (!Nombre || !Email || !Contrasena) {
    return res.status(400).json({
      mensaje: 'Faltan campos obligatorios'
    });
  }

  try {
    const hash = await bcrypt.hash(Contrasena, 10);

    const sql = `
      INSERT INTO usuarios
      (Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, Contrasena)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        Nombre,
        Apaterno,
        Amaterno,
        Fechanac,
        Sexo,
        Email,
        Pais,
        Ciudad,
        hash
      ],
      (err, result) => {
        if (err) {
          console.error('❌ Error al insertar:', err);
          return res.status(500).json({
            mensaje: 'Error al registrar usuario'
          });
        }

        console.log('✅ Usuario insertado con ID:', result.insertId);
        res.json({
          mensaje: 'Usuario registrado correctamente'
        });
      }
    );
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({
      mensaje: 'Error general'
    });
  }
});

/* =========================
   ✅ ARRANCAR SERVIDOR
   ========================= */
app.listen(4000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:4000');
});
