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
    Contrasena VARCHAR(255) NOT NULL,
    Telefono VARCHAR(20),
    Pais VARCHAR(100),
    Ciudad VARCHAR(100),
    Rol ENUM('admin','user','guest') DEFAULT 'user',
    Estado ENUM('activo','inactivo','bloqueado') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL
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

  const tablaNdexo = `
    CREATE TABLE IF NOT EXISTS ndexo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Alias VARCHAR(150) NOT NULL UNIQUE,
    lugar_interaccion VARCHAR(150),
    actitud VARCHAR(150),
    relacion VARCHAR(150),
    fecha_inicio DATE,
    nivel_estress INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT NOT NULL,
    CONSTRAINT fk_usuario_ndexo FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
);
  `;

  const tablaVasodeagua = `
   CREATE TABLE IF NOT EXISTS vasodeagua (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar VARCHAR(150),
    aliasdelndexo INT NOT NULL, -- FK a la tabla ndexo
    usuario_id INT NOT NULL,     -- FK a la tabla usuarios (NUEVA)
    problema_causado TEXT,
    medio_problema VARCHAR(150),
    resultados TEXT,
    como_me_senti TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Llave foránea hacia ndexo
    CONSTRAINT fk_ndexo FOREIGN KEY (aliasdelndexo) REFERENCES ndexo(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    
    -- Llave foránea hacia usuarios (Asegúrate que tu tabla de usuarios se llame 'usuarios')
    CONSTRAINT fk_usuario_vaso FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
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

  db.query(tablaNdexo, (err) => {
    if (err) console.error('❌ Error creando tabla ndexo:', err);
    else console.log('✅ Tabla "ndexo" lista.');
  });

  db.query(tablaVasodeagua, (err) => {
    if (err) console.error('❌ Error creando tabla vasodeagua:', err);
    else console.log('✅ Tabla "vasodeagua" lista.');
  });
};

inicializarTablas();



/* ==========================================
   ✅ RUTAS
   ========================================== */

// Registro de usuarios
/* 
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
});*/

// Ruta de Registro
app.post('/registro', async (req, res) => {
  const {
    Nombre,
    Apaterno,
    Amaterno,
    Fechanac,
    Sexo,
    Email,
    Telefono,
    Pais,
    Ciudad,
    Rol,
    Estado,
    Contrasena
  } = req.body;

  // Validación básica
  if (!Nombre || !Apaterno || !Fechanac || !Sexo || !Email || !Contrasena || !Pais || !Ciudad) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  try {
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(Contrasena, 10);

    const sql = `
      INSERT INTO usuarios 
      (Nombre, Apaterno, Amaterno, Fechanac, Sexo, Email, Telefono, Pais, Ciudad, Rol, Estado, Contrasena) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
      Nombre,
      Apaterno,
      Amaterno,
      Fechanac,
      Sexo,
      Email,
      Telefono,
      Pais,
      Ciudad,
      Rol || 'user',       // Valor por defecto si no se envía
      Estado || 'activo',  // Valor por defecto si no se envía
      hashedPassword
    ], (err, result) => {
      if (err) {
        console.error('Error al registrar usuario:', err);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
      }
      res.json({ mensaje: 'Usuario registrado exitosamente', id: result.insertId });
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud' });
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

/* ==========================================
   🚀 REGISTRAR NDEXO
   ========================================== */
   /* app.post('/ndexo', (req, res) => {
  const { Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress } = req.body;
  const sql = `INSERT INTO ndexo (Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(sql, [Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress], (err, result) => {
    if (err) return res.status(500).json({ mensaje: 'Error al guardar N De-XOO' });
    res.json({ mensaje: 'N De-XOO registrado correctamente', id: result.insertId });
  });
});*/

// Ruta para registrar ndexo con llave foránea
app.post('/ndexo', (req, res) => {
  // 👇 Esto imprime todo lo que llega desde el frontend
  console.log('Datos recibidos en /ndexo:', req.body);

  const { Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress, usuario_id } = req.body;

  // Validación básica
  if (!Alias || !usuario_id) {
    return res.status(400).json({ mensaje: 'Alias y usuario_id son obligatorios' });
  }

  const sql = `
    INSERT INTO ndexo (Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress, usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [Alias, lugar_interaccion, actitud, relacion, fecha_inicio, nivel_estress, usuario_id], (err, result) => {
    if (err) {
      console.error('Error al registrar ndexo:', err);
      return res.status(500).json({ mensaje: 'Error al guardar N De-XOO' });
    }
    res.json({ mensaje: 'N De-XOO registrado correctamente', id: result.insertId });
  });
});




/* ==========================================
   🚀 AGREGARLE GOTAS AL VASO
   ========================================== */
app.post('/vasodeagua', (req, res) => {
    // Desestructuramos los datos que vienen del frontend
    const { 
        fecha, 
        hora, 
        lugar, 
        aliasdelndexo, 
        usuario_id, 
        problema_causado, 
        medio_problema, 
        resultados, 
        como_me_senti 
    } = req.body;

    // Validación básica de integridad
    if (!usuario_id || !aliasdelndexo) {
        return res.status(400).json({ 
            mensaje: 'Faltan datos obligatorios: usuario_id o aliasdelndexo' 
        });
    }

    const sql = `INSERT INTO vasodeagua 
                 (fecha, hora, lugar, aliasdelndexo, usuario_id, problema_causado, medio_problema, resultados, como_me_senti) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        fecha, 
        hora, 
        lugar, 
        aliasdelndexo, 
        usuario_id, 
        problema_causado, 
        medio_problema, 
        resultados, 
        como_me_senti
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            // Imprimimos el error completo en la consola del servidor para debuggear
            console.error("❌ Error en INSERT vasodeagua:", err.message);
            
            // Si el error es por llave foránea (usuario o ndexo no existen)
            if (err.errno === 1452) {
                return res.status(400).json({ 
                    mensaje: 'Error de relación: El ID de usuario o el ID del Ndexo no existen.' 
                });
            }

            return res.status(500).json({ 
                mensaje: 'Error interno al guardar el registro en la base de datos' 
            });
        }

        // Respuesta exitosa
        res.json({ 
            mensaje: '¡Gota registrada correctamente en el vaso!', 
            id: result.insertId 
        });
    });
});

/* ==========================================
   Ruta para obtener ndexos de un usuario
   ========================================== */

   app.get('/ndexo', (req, res) => {
  const { usuario_id } = req.query;

  if (!usuario_id) {
    return res.status(400).json({ mensaje: 'usuario_id es obligatorio' });
  }

  const sql = 'SELECT * FROM ndexo WHERE usuario_id = ? ORDER BY fecha_registro DESC';

  db.query(sql, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener ndexos:', err);
      return res.status(500).json({ mensaje: 'Error al obtener ndexos' });
    }
    res.json(results);
  });
});

/* ==========================================
   Ruta para obtener las gotas del vaso de un usario  
   ========================================== */
app.get('/historial-vaso', (req, res) => {
    const { usuario_id } = req.query;
    // Hacemos un JOIN para saber de qué Alias es cada gota
    const sql = `
        SELECT v.*, n.Alias 
        FROM vasodeagua v 
        JOIN ndexo n ON v.aliasdelndexo = n.id 
        WHERE v.usuario_id = ? 
        ORDER BY v.fecha DESC, v.hora DESC`;
    
    db.query(sql, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener historial' });
        res.json(results);
    });
});


/* ==========================================
   Ruta para actualizar parcialmente un Ndexo (Soft Delete)
   ========================================== */

app.patch('/ndexo/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const query = "UPDATE ndexo SET status = ? WHERE id = ?";
    
    db.query(query, [status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ mensaje: "Error en la base de datos", error: err });
        }
        res.json({ mensaje: "Estatus actualizado con éxito" });
    });
});