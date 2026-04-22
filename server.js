const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config(); // Recuerda instalar: npm install dotenv

const app = express();

/* =========================
   ✅ CONFIGURACIÓN
   ========================= */
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'sql3.freesqldatabase.com',
  user: process.env.DB_USER || 'sql3771895',
  password: process.env.DB_PASSWORD || 'hy4ta1yPug',
  database: process.env.DB_NAME || 'sql3771895',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

/* ==========================================
   ✅ CREACIÓN AUTOMÁTICA DE TABLAS
   ========================================== */
const inicializarTablas = () => {
  const tablaUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      Nombre VARCHAR(100) NOT NULL,
      Apaterno VARCHAR(100),
      Amaterno VARCHAR(100),
      Fechanac DATE,
      Sexo VARCHAR(20),
      Email VARCHAR(150) UNIQUE NOT NULL,
      Pais VARCHAR(100),
      Ciudad VARCHAR(100),
      Contrasena VARCHAR(255) NOT NULL,
      fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const tablaSolicitudes = `
    CREATE TABLE IF NOT EXISTS solicitudes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombresolicitud VARCHAR(150) NOT NULL,
      correo VARCHAR(150) NOT NULL,
      comentario TEXT NOT NULL,
      fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Ejecutamos las consultas
  db.query(tablaUsuarios, (err) => {
    if (err) console.error('❌ Error creando tabla usuarios:', err);
    else console.log('✅ Tabla "usuarios" lista.');
  });

  db.query(tablaSolicitudes, (err) => {
    if (err) console.error('❌ Error creando tabla solicitudes:', err);
    else console.log('✅ Tabla "solicitudes" lista.');
  });
};

// Llamamos a la función de inicialización
inicializarTablas();

/* =========================
   ✅ RUTA DE REGISTRO
   ========================= */
app.post('/registro', async (req, res) => {
  const { Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, Contrasena } = req.body;

  if (!Nombre || !Email || !Contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(Contrasena, 10);
    const sql = `INSERT INTO usuarios (Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, Contrasena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, hash], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensaje: 'El correo ya está registrado' });
        return res.status(500).json({ mensaje: 'Error al registrar usuario' });
      }
      res.json({ mensaje: 'Usuario registrado correctamente', id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error general' });
  }
});

/* ... (Tus rutas de Login y Solicitudes se mantienen igual) ... */

app.listen(4000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:4000');
});