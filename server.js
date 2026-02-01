const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

/* =========================
   ✅ CONFIGURACIÓN CORS
   ========================= */
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // permite ambos
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));

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
  const { Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, Contrasena } = req.body;

  if (!Nombre || !Email || !Contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(Contrasena, 10);

    const sql = `
      INSERT INTO usuarios
      (Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, Contrasena)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Pais, Ciudad, hash], (err, result) => {
      if (err) {
        console.error('❌ Error al insertar:', err);
        return res.status(500).json({ mensaje: 'Error al registrar usuario' });
      }

      res.json({ mensaje: 'Usuario registrado correctamente', id: result.insertId });
    });
  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ mensaje: 'Error general' });
  }
});

/* =========================
   ✅ RUTA DE LOGIN
   ========================= */
app.post('/login', (req, res) => {
  const { Email, Contrasena } = req.body;

  if (!Email || !Contrasena) {
    return res.status(400).json({ mensaje: 'Faltan campos' });
  }

  const sql = 'SELECT * FROM usuarios WHERE Email = ? LIMIT 1';

  db.query(sql, [Email], async (err, results) => {
    if (err) {
      console.error('❌ Error en la consulta:', err);
      return res.status(500).json({ mensaje: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    // Comparar contraseña
    const match = await bcrypt.compare(Contrasena, usuario.Contrasena);

    if (!match) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        Nombre: usuario.Nombre,
        Apaterno: usuario.Apaterno,
        Amaterno: usuario.Amaterno,
        Email: usuario.Email,
        Ciudad: usuario.Ciudad,
        Pais: usuario.Pais
      }
    });
  });
});


/* =========================
   ✅ RUTA GUARDAR SOLICITUD
   ========================= */
app.post('/solicitudes', (req, res) => {
  const { nombresolicitud, correo, comentario } = req.body;

  if (!nombresolicitud || !correo || !comentario) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  const sql = `
    INSERT INTO solicitudes (nombresolicitud, correo, comentario)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [nombresolicitud, correo, comentario], (err, result) => {
    if (err) {
      console.error('❌ Error al guardar solicitud:', err);
      return res.status(500).json({ mensaje: 'Error al guardar la solicitud' });
    }

    res.json({
      mensaje: 'Solicitud guardada correctamente',
      id: result.insertId
    });
  });
});



/* =========================
   ✅ ARRANCAR SERVIDOR
   ========================= */
app.listen(4000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:4000');
});
