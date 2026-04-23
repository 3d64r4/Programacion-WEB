const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config(); // Carga las variables del archivo .env

const app = express();

/* ==========================================
   ✅ CONFIGURACIÓN DE LA BASE DE DATOS
   ========================================== */
// Usamos process.env para leer los datos del archivo .env
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión inicial
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a Railway:', err.message);
  } else {
    console.log('🚀 Conexión exitosa a Railway MySQL');
    connection.release();
  }
});

/* ==========================================
   ✅ MIDDLEWARES
   ========================================== */
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

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

  db.query(tablaUsuarios, (err) => {
    if (err) console.error('❌ Error creando tabla usuarios:', err);
    else console.log('✅ Tabla "usuarios" lista.');
  });

  db.query(tablaSolicitudes, (err) => {
    if (err) console.error('❌ Error creando tabla solicitudes:', err);
    else console.log('✅ Tabla "solicitudes" lista.');
  });
};

inicializarTablas();

/* ==========================================
   ✅ RUTAS
   ========================================== */

// Registro de usuarios
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

// Ruta de Login
app.post('/login', (req, res) => {
  const { Email, Contrasena } = req.body;
  const sql = 'SELECT * FROM usuarios WHERE Email = ? LIMIT 1';

  db.query(sql, [Email], async (err, results) => {
    if (err) return res.status(500).json({ mensaje: 'Error en el servidor' });
    if (results.length === 0) return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const match = await bcrypt.compare(Contrasena, results[0].Contrasena);
    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    res.json({ mensaje: 'Login exitoso', usuario: results[0] });
  });
});

// Ruta guardar solicitud
app.post('/solicitudes', (req, res) => {
  const { nombresolicitud, correo, comentario } = req.body;
  const sql = `INSERT INTO solicitudes (nombresolicitud, correo, comentario) VALUES (?, ?, ?)`;

  db.query(sql, [nombresolicitud, correo, comentario], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al guardar solicitud' });
    res.json({ mensaje: 'Solicitud guardada', id: result.insertId });
  });
});

/* ==========================================
   🚀 INICIO DEL SERVIDOR
   ========================================== */
app.listen(4000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:4000');
});