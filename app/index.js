const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const Redis = require('ioredis');

let redisClient;

// Verificar el entorno y conectar a Redis solo en producción
if (process.env.NODE_ENV === 'production') {
  redisClient = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  });

  // Eventos importantes de Redis
  redisClient.on('connect', () => {
    console.log('Conectado a Redis');
  });

  redisClient.on('ready', () => {
    console.log('Cliente Redis está listo');
  });

  redisClient.on('error', (err) => {
    console.error('Error de conexión a Redis:', err);
  });

  redisClient.on('end', () => {
    console.log('Cliente Redis desconectado');
  });
} else {
  console.log('Redis no está configurado para el entorno de desarrollo');
}

app.use(bodyParser.urlencoded({ extended: true }));

// Crear un pool de conexiones a PostgreSQL
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Ruta raíz para mostrar el estado de la base de datos y los datos almacenados (Entorno Dev)
// Ruta raíz para mostrar el estado de la base de datos y de Redis y mostrar los datos almacenados en ambos (Entorno Pro)
app.get('/', async (req, res) => {
  let dbStatus;
  let redisStatus;
  let tables;
  let tableData = {};

  // Verificar el estado de la base de datos
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    dbStatus = 'OK';

    // Obtener todas las tablas en el esquema 'public'
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    tables = tablesResult.rows.map(row => row.table_name);

    // Obtener datos de cada tabla
    for (let table of tables) {
      const result = await client.query(`SELECT * FROM ${table}`);
      tableData[table] = result.rows;  // Guardamos los datos de cada tabla
    }

    client.release();
  } catch (err) {
    console.error('Error al ejecutar la consulta', err);
    dbStatus = 'Error: ' + err.message;
    tables = [];
    tableData = {};
  }

  // Verificar el estado de Redis con un manejo de error
  try {
    await redisClient.ping();  // Intentar hacer ping a Redis
    redisStatus = 'OK';
  } catch (err) {
    console.error('Error de conexión a Redis:', err);
    redisStatus = 'Error: Redis no disponible';  // Mostrar estado de error
  }

  // Generar HTML para mostrar el estado de la base de datos y Redis
  let responseHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Database Status</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
      <div class="container my-4">
        <h1 class="text-center">Estado de Conexiones</h1>
        <p class="text-center ${dbStatus === 'OK' ? 'text-success' : 'text-danger'}">
          Estado de la Base de Datos: ${dbStatus}
        </p>
        <p class="text-center ${redisStatus === 'OK' ? 'text-success' : 'text-danger'}">
          Estado de Redis: ${redisStatus}
        </p>
        <hr>
        <h2 class="text-center">Tablas y datos disponibles:</h2>
  `;

  // Mostrar las tablas y sus datos
  for (let table of tables) {
    responseHtml += `<h3>${table}</h3>`;

    if (tableData[table].length > 0) {
      responseHtml += `
        <table class="table table-striped table-bordered">
          <thead class="thead-dark">
            <tr>
              ${Object.keys(tableData[table][0]).map(key => `<th>${key}</th>`).join('')}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
      `;

      tableData[table].forEach(row => {
        responseHtml += `
          <tr>
            ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
            <td>
              <form action="/delete" method="POST" style="display: inline;">
                <input type="hidden" name="id" value="${row.id}">
                <input type="hidden" name="table" value="${table}">
                <button type="submit" class="btn btn-danger btn-sm">Eliminar</button>
              </form>
            </td>
          </tr>
        `;
      });

      responseHtml += `</tbody></table>`;
      // Formulario para agregar nuevos elementos
      responseHtml += `
      <h4>Añadir nuevo elemento en ${table}</h4>
      <form action="/add" method="POST">
        <input type="hidden" name="table" value="${table}">
        ${Object.keys(tableData[table][0]).map(key => `
          <input type="text" name="${key}" placeholder="${key}" required>
        `).join('')}
        <button type="submit" class="btn btn-primary">Agregar</button>
      </form>
      <hr>
    `;
    } else {
      responseHtml += `<p>No hay datos disponibles en ${table}.</p>`;
    }
  }

  // Sección para mostrar los datos de Redis solo si Redis está disponible
  if (redisStatus === 'OK') {
    try {
      const keys = await redisClient.keys('*');  // Obtener todas las claves de Redis

      if (keys.length === 0) {
        responseHtml += '<h2 class="text-center">No hay claves en Redis</h2>';
      } else {
        responseHtml += `
          <h2 class="text-center">Datos en Redis</h2>
          <table class="table table-striped table-bordered">
            <thead class="thead-dark">
              <tr>
                <th>Clave</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
        `;

        const values = await Promise.all(
          keys.map(async (key) => {
            const value = await redisClient.get(key);
            return { key, value };
          })
        );

        values.forEach(({ key, value }) => {
          responseHtml += `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `;
        });

        responseHtml += `</tbody></table>`;
      }
    } catch (err) {
      console.error('Error al obtener claves de Redis:', err);
      responseHtml += '<h2 class="text-danger text-center">Error al obtener claves de Redis</h2>';
    }
  }

  responseHtml += '</div></body></html>';

  // Enviar la respuesta final
  res.send(responseHtml);
});



// Ruta para agregar un nuevo elemento en una tabla
app.post('/add', async (req, res) => {
  const { table, ...fields } = req.body;

  // Generar la consulta para insertar los datos
  const columns = Object.keys(fields).join(', ');
  const values = Object.values(fields).map((value, index) => `$${index + 1}`).join(', ');
  const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;

  try {
    const client = await pool.connect();
    await client.query(query, Object.values(fields));
    client.release();
    res.redirect('/');
  } catch (err) {
    console.error('Error al agregar datos:', err);
    res.send('Error al agregar datos: ' + err.message);
  }
});

// Ruta para eliminar un elemento de una tabla
app.post('/delete', async (req, res) => {
  const { id, table } = req.body;

  try {
    const client = await pool.connect();
    await client.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    client.release();
    res.redirect('/');
  } catch (err) {
    console.error('Error al eliminar el elemento:', err);
    res.send('Error al eliminar el elemento: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
