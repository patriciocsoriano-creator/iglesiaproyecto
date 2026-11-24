
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let db;

// =====================================================
// SEGURIDAD: HASH DE CONTRASEÑAS
// =====================================================

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// =====================================================
// UTILIDAD: AGREGAR COLUMNAS SIN DUPLICARLAS
// =====================================================

function agregarColumnasSiNoExisten(tabla, columnasNuevas) {
  const columnasActuales = db
    .prepare(`PRAGMA table_info(${tabla})`)
    .all();

  for (const columna of columnasNuevas) {
    const existe = columnasActuales.some(
      actual => actual.name === columna.nombre
    );

    if (!existe) {
      db.exec(`
        ALTER TABLE ${tabla}
        ADD COLUMN ${columna.nombre} ${columna.definicion}
      `);
    }
  }
}

// =====================================================
// INICIALIZAR BASE DE DATOS
// =====================================================

function initializeDatabase() {

  const databaseFolder = path.join(
    process.env.APPDATA || process.env.HOME,
    'Iglesia'
  );

  if (!fs.existsSync(databaseFolder)) {
    fs.mkdirSync(databaseFolder, { recursive: true });
  }

  const databasePath = path.join(databaseFolder, 'iglesia.db');

  db = new Database(databasePath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ---------------------------------------------------
  // TABLA DE PRIMERAS COMUNIONES
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS comuniones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      numero_comunion TEXT NOT NULL,
      fecha_comunion TEXT NOT NULL,
      tomo_comunion TEXT NOT NULL DEFAULT '',
      pagina_comunion TEXT NOT NULL DEFAULT '',
      lugar_comunion TEXT NOT NULL,
      ministro TEXT NOT NULL,

      cedula TEXT NOT NULL DEFAULT '',
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      lugar_nacimiento TEXT NOT NULL DEFAULT '',
      fecha_nacimiento TEXT NOT NULL,

      parroquia_bautismo TEXT NOT NULL DEFAULT '',
      fecha_bautismo TEXT NOT NULL DEFAULT '',

      nombre_padre TEXT NOT NULL DEFAULT '',
      nombre_madre TEXT NOT NULL DEFAULT '',
      padrino TEXT NOT NULL DEFAULT '',
      madrina TEXT NOT NULL DEFAULT '',

      parroco_nombre TEXT NOT NULL DEFAULT '',
      pie_firma TEXT NOT NULL DEFAULT 'Párroco',
      parroco_firma_data TEXT NOT NULL DEFAULT '',
      parroco_firma_tipo TEXT NOT NULL DEFAULT '',

      fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(numero_comunion)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_comuniones_cedula
    ON comuniones(cedula);

    CREATE INDEX IF NOT EXISTS idx_comuniones_apellidos
    ON comuniones(apellidos);
  `);

  // ---------------------------------------------------
  // TABLA DE USUARIOS
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      nombre_completo TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'administrador',
      activo INTEGER NOT NULL DEFAULT 1,
      fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  crearAdministradorInicial();

  // ---------------------------------------------------
  // CONFIGURACIÓN PARROQUIAL
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_parroquial (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      parroco_nombre TEXT NOT NULL DEFAULT '',
      pie_firma TEXT NOT NULL DEFAULT 'Párroco',
      fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ---------------------------------------------------
  // MIGRACIÓN: CONFIGURACIÓN PARROQUIAL
  // ---------------------------------------------------

  const columnasConfiguracion = [
    {
      nombre: 'parroco_firma_data',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'parroco_firma_tipo',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'diocesis_nombre',
      definicion: "TEXT NOT NULL DEFAULT 'Diócesis de Santa Elena'"
    },
    {
      nombre: 'vicaria_nombre',
      definicion: "TEXT NOT NULL DEFAULT 'Vicaría San José'"
    },
    {
      nombre: 'parroquia_nombre',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'logo_diocesis_data',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'logo_diocesis_tipo',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'logo_parroquia_data',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'logo_parroquia_tipo',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'sello_parroquia_data',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'sello_parroquia_tipo',
      definicion: "TEXT NOT NULL DEFAULT ''"
    }
  ];

  agregarColumnasSiNoExisten(
    'configuracion_parroquial',
    columnasConfiguracion
  );

  // ---------------------------------------------------
  // CREAR CONFIGURACIÓN INICIAL
  // ---------------------------------------------------

  db.prepare(`
    INSERT OR IGNORE INTO configuracion_parroquial (
      id,
      parroco_nombre,
      pie_firma,
      parroco_firma_data,
      parroco_firma_tipo
    )
    VALUES (1, '', 'Párroco', '', '')
  `).run();

  // ---------------------------------------------------
  // TABLA DE BAUTIZOS
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS bautizos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      numero_bautizo TEXT NOT NULL,
      fecha_bautizo TEXT NOT NULL,
      tomo_bautizo TEXT NOT NULL DEFAULT '',
      pagina_bautizo TEXT NOT NULL DEFAULT '',
      lugar_bautizo TEXT NOT NULL,
      ministro TEXT NOT NULL,

      nombres_bautizado TEXT NOT NULL,
      apellidos_bautizado TEXT NOT NULL,
      lugar_nacimiento TEXT NOT NULL DEFAULT '',
      fecha_nacimiento TEXT NOT NULL,

      nombre_padre TEXT NOT NULL DEFAULT '',
      nombre_madre TEXT NOT NULL DEFAULT '',
      padrino TEXT NOT NULL DEFAULT '',
      madrina TEXT NOT NULL DEFAULT '',

      cedula TEXT NOT NULL DEFAULT '',
      anio_registro TEXT NOT NULL DEFAULT '',
      tomo_registro TEXT NOT NULL DEFAULT '',
      pagina_registro TEXT NOT NULL DEFAULT '',
      acta_registro TEXT NOT NULL DEFAULT '',
      lugar_registro TEXT NOT NULL DEFAULT '',

      nota_marginal TEXT NOT NULL DEFAULT 'Ninguna',

      parroco_nombre TEXT NOT NULL DEFAULT '',
      pie_firma TEXT NOT NULL DEFAULT 'Párroco',

      fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bautizos_numero
    ON bautizos(numero_bautizo);

    CREATE INDEX IF NOT EXISTS idx_bautizos_apellidos
    ON bautizos(apellidos_bautizado);

    CREATE INDEX IF NOT EXISTS idx_bautizos_cedula
    ON bautizos(cedula);
  `);

  // ---------------------------------------------------
  // TABLA DE CONFIRMACIONES
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS confirmaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      numero_confirmacion TEXT NOT NULL UNIQUE,
      fecha_confirmacion TEXT NOT NULL,
      tomo_confirmacion TEXT NOT NULL DEFAULT '',
      pagina_confirmacion TEXT NOT NULL DEFAULT '',
      lugar_confirmacion TEXT NOT NULL,
      ministro TEXT NOT NULL,

      cedula TEXT NOT NULL DEFAULT '',
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      lugar_nacimiento TEXT NOT NULL DEFAULT '',
      fecha_nacimiento TEXT NOT NULL,

      parroquia_bautismo TEXT NOT NULL DEFAULT '',
      fecha_bautismo TEXT NOT NULL DEFAULT '',

      nombre_padre TEXT NOT NULL DEFAULT '',
      nombre_madre TEXT NOT NULL DEFAULT '',

      nombre_padrino TEXT NOT NULL DEFAULT '',
      nombre_madrina TEXT NOT NULL DEFAULT '',

      parroco_nombre TEXT NOT NULL DEFAULT '',
      pie_firma TEXT NOT NULL DEFAULT 'Párroco',
      parroco_firma_data TEXT NOT NULL DEFAULT '',
      parroco_firma_tipo TEXT NOT NULL DEFAULT '',

      fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_confirmaciones_cedula
    ON confirmaciones(cedula);

    CREATE INDEX IF NOT EXISTS idx_confirmaciones_apellidos
    ON confirmaciones(apellidos);
  `);

  // ---------------------------------------------------
  // TABLA DE MATRIMONIOS
  // ---------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS matrimonios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      numero_matrimonio TEXT NOT NULL UNIQUE,
      fecha_matrimonio TEXT NOT NULL,
      tomo_matrimonio TEXT NOT NULL DEFAULT '',
      pagina_matrimonio TEXT NOT NULL DEFAULT '',
      lugar_matrimonio TEXT NOT NULL,
      ministro TEXT NOT NULL,

      nombres_esposo TEXT NOT NULL,
      apellidos_esposo TEXT NOT NULL,
      cedula_esposo TEXT NOT NULL DEFAULT '',
      fecha_nacimiento_esposo TEXT NOT NULL DEFAULT '',
      lugar_nacimiento_esposo TEXT NOT NULL DEFAULT '',
      nombre_padre_esposo TEXT NOT NULL DEFAULT '',
      nombre_madre_esposo TEXT NOT NULL DEFAULT '',

      nombres_esposa TEXT NOT NULL,
      apellidos_esposa TEXT NOT NULL,
      cedula_esposa TEXT NOT NULL DEFAULT '',
      fecha_nacimiento_esposa TEXT NOT NULL DEFAULT '',
      lugar_nacimiento_esposa TEXT NOT NULL DEFAULT '',
      nombre_padre_esposa TEXT NOT NULL DEFAULT '',
      nombre_madre_esposa TEXT NOT NULL DEFAULT '',

      testigo_1 TEXT NOT NULL DEFAULT '',
      testigo_2 TEXT NOT NULL DEFAULT '',

      parroco_nombre TEXT NOT NULL DEFAULT '',
      pie_firma TEXT NOT NULL DEFAULT 'Párroco',
      parroco_firma_data TEXT NOT NULL DEFAULT '',
      parroco_firma_tipo TEXT NOT NULL DEFAULT '',

      fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ---------------------------------------------------
  // MIGRACIÓN: CAMPOS ADICIONALES DE MATRIMONIOS
  // ---------------------------------------------------

  const columnasMatrimonios = [
    {
      nombre: 'parroquia_bautismo_esposo',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'parroquia_bautismo_esposa',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'padrinos_boda',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'anio_registro_civil',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'libro_registro_civil',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'folio_registro_civil',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'acta_registro_civil',
      definicion: "TEXT NOT NULL DEFAULT ''"
    },
    {
      nombre: 'observacion',
      definicion: "TEXT NOT NULL DEFAULT 'Ninguna'"
    }
  ];

  agregarColumnasSiNoExisten(
    'matrimonios',
    columnasMatrimonios
  );

  // ---------------------------------------------------
  // ÍNDICES DE MATRIMONIOS
  // ---------------------------------------------------

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_matrimonios_numero
    ON matrimonios(numero_matrimonio);

    CREATE INDEX IF NOT EXISTS idx_matrimonios_esposo
    ON matrimonios(apellidos_esposo);

    CREATE INDEX IF NOT EXISTS idx_matrimonios_esposa
    ON matrimonios(apellidos_esposa);

    CREATE INDEX IF NOT EXISTS idx_matrimonios_cedula_esposo
    ON matrimonios(cedula_esposo);

    CREATE INDEX IF NOT EXISTS idx_matrimonios_cedula_esposa
    ON matrimonios(cedula_esposa);
  `);

  console.log('Base de datos SQLite inicializada.');
}

// =====================================================
// CREAR ADMINISTRADOR INICIAL
// =====================================================

function crearAdministradorInicial() {

  const cantidad = db
    .prepare('SELECT COUNT(*) AS total FROM usuarios')
    .get();

  if (cantidad.total === 0) {

    const usuario = 'admin';
    const contrasena = 'Iglesia2026!';

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(contrasena, salt);

    db.prepare(`
      INSERT INTO usuarios (
        usuario,
        nombre_completo,
        password_hash,
        salt,
        rol
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      usuario,
      'Administrador del sistema',
      passwordHash,
      salt,
      'administrador'
    );

    console.log('Administrador inicial creado.');
  }
}

// =====================================================
// AUTENTICAR USUARIO
// =====================================================

function autenticarUsuario(usuario, contrasena) {

  const registro = db.prepare(`
    SELECT
      id,
      usuario,
      nombre_completo,
      password_hash,
      salt,
      rol,
      activo
    FROM usuarios
    WHERE usuario = ? COLLATE NOCASE
  `).get(usuario.trim());

  if (!registro || registro.activo !== 1) {
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos.'
    };
  }

  const passwordHash = hashPassword(contrasena, registro.salt);

  const hashGuardado = Buffer.from(registro.password_hash, 'hex');
  const hashIngresado = Buffer.from(passwordHash, 'hex');

  if (
    hashGuardado.length !== hashIngresado.length ||
    !crypto.timingSafeEqual(hashGuardado, hashIngresado)
  ) {
    return {
      success: false,
      message: 'Usuario o contraseña incorrectos.'
    };
  }

  return {
    success: true,
    user: {
      id: registro.id,
      usuario: registro.usuario,
      nombre: registro.nombre_completo,
      rol: registro.rol
    }
  };
}

// =====================================================
// OBTENER CONFIGURACIÓN VIGENTE DEL PÁRROCO
// =====================================================

function obtenerParrocoVigente() {

  return db.prepare(`
    SELECT
      parroco_nombre,
      pie_firma,
      parroco_firma_data,
      parroco_firma_tipo,

      diocesis_nombre,
      vicaria_nombre,
      parroquia_nombre,

      logo_diocesis_data,
      logo_diocesis_tipo,
      logo_parroquia_data,
      logo_parroquia_tipo,

      sello_parroquia_data,
      sello_parroquia_tipo,

      fecha_actualizacion

    FROM configuracion_parroquial
    WHERE id = 1
  `).get();
}

// =====================================================
// GUARDAR CONFIGURACIÓN DEL PÁRROCO
// =====================================================

function guardarParrocoVigente(
  nombre,
  pieFirma = 'Párroco',
  firmaData = '',
  firmaTipo = '',
  identidad = {}
) {

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    nombre.trim().length > 200
  ) {
    throw new Error('El nombre del párroco es obligatorio o inválido.');
  }

  if (
    typeof pieFirma !== 'string' ||
    pieFirma.trim().length > 100
  ) {
    throw new Error('Pie de firma inválido.');
  }

  const validarImagen = (data, tipo, nombreImagen) => {

    if (typeof data !== 'string' || data.length > 3000000) {
      throw new Error(`La imagen de ${nombreImagen} es demasiado grande.`);
    }

    if (!['', 'image/png', 'image/jpeg'].includes(tipo)) {
      throw new Error(`Formato de ${nombreImagen} no permitido.`);
    }

    if (data && !tipo) {
      throw new Error(`No se especificó el formato de ${nombreImagen}.`);
    }
  };

  validarImagen(firmaData, firmaTipo, 'firma');

  validarImagen(
    identidad.logoDiocesisData || '',
    identidad.logoDiocesisTipo || '',
    'la diócesis'
  );

  validarImagen(
    identidad.logoParroquiaData || '',
    identidad.logoParroquiaTipo || '',
    'la parroquia'
  );

  validarImagen(
    identidad.selloParroquiaData || '',
    identidad.selloParroquiaTipo || '',
    'el sello parroquial'
  );

  const diocesisNombre =
    String(identidad.diocesisNombre || '').trim();

  const vicariaNombre =
    String(identidad.vicariaNombre || '').trim();

  const parroquiaNombre =
    String(identidad.parroquiaNombre || '').trim();

  if (!diocesisNombre || diocesisNombre.length > 200) {
    throw new Error('Ingresa un nombre de diócesis válido.');
  }

  if (!vicariaNombre || vicariaNombre.length > 200) {
    throw new Error('Ingresa un nombre de vicaría válido.');
  }

  if (parroquiaNombre.length > 200) {
    throw new Error('El nombre de la parroquia es demasiado largo.');
  }

  db.prepare(`
    UPDATE configuracion_parroquial
    SET
      parroco_nombre = ?,
      pie_firma = ?,
      parroco_firma_data = ?,
      parroco_firma_tipo = ?,

      diocesis_nombre = ?,
      vicaria_nombre = ?,
      parroquia_nombre = ?,

      logo_diocesis_data = ?,
      logo_diocesis_tipo = ?,
      logo_parroquia_data = ?,
      logo_parroquia_tipo = ?,

      sello_parroquia_data = ?,
      sello_parroquia_tipo = ?,

      fecha_actualizacion = CURRENT_TIMESTAMP

    WHERE id = 1
  `).run(
    nombre.trim(),
    pieFirma.trim() || 'Párroco',
    firmaData,
    firmaTipo,

    diocesisNombre,
    vicariaNombre,
    parroquiaNombre,

    identidad.logoDiocesisData || '',
    identidad.logoDiocesisTipo || '',
    identidad.logoParroquiaData || '',
    identidad.logoParroquiaTipo || '',

    identidad.selloParroquiaData || '',
    identidad.selloParroquiaTipo || ''
  );

  return obtenerParrocoVigente();
}

// =====================================================
// GUARDAR REGISTRO DE BAUTIZO
// =====================================================

function guardarBautizo(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos del bautizo son inválidos.');
  }

  const camposObligatorios = [
    'numero_bautizo',
    'fecha_bautizo',
    'lugar_bautizo',
    'ministro',
    'nombres_bautizado',
    'apellidos_bautizado',
    'fecha_nacimiento'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  const bautizoPorNumero = db.prepare(`
    SELECT id, numero_bautizo
    FROM bautizos
    WHERE UPPER(TRIM(numero_bautizo)) =
          UPPER(TRIM(?))
    LIMIT 1
  `).get(datos.numero_bautizo);

  if (bautizoPorNumero) {
    throw new Error(
      `Ya existe un bautizo registrado con el número ${bautizoPorNumero.numero_bautizo}. No se puede duplicar.`
    );
  }

  const bautizoPorPersona = db.prepare(`
    SELECT id, numero_bautizo
    FROM bautizos
    WHERE
      UPPER(TRIM(nombres_bautizado)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_bautizado)) = UPPER(TRIM(?))
      AND fecha_nacimiento = ?
      AND fecha_bautizo = ?
    LIMIT 1
  `).get(
    datos.nombres_bautizado.trim(),
    datos.apellidos_bautizado.trim(),
    datos.fecha_nacimiento,
    datos.fecha_bautizo
  );

  if (bautizoPorPersona) {
    throw new Error(
      `Esta persona ya tiene un bautizo registrado con el número ${bautizoPorPersona.numero_bautizo}. Verifica la información antes de continuar.`
    );
  }

  if (datos.cedula && datos.cedula.trim()) {

    const bautizoPorCedula = db.prepare(`
      SELECT id, numero_bautizo
      FROM bautizos
      WHERE
        TRIM(cedula) = TRIM(?)
        AND fecha_bautizo = ?
      LIMIT 1
    `).get(
      datos.cedula.trim(),
      datos.fecha_bautizo
    );

    if (bautizoPorCedula) {
      throw new Error(
        `La cédula ingresada ya tiene un bautizo registrado con el número ${bautizoPorCedula.numero_bautizo}.`
      );
    }
  }

  const parroco = obtenerParrocoVigente();

  const resultado = db.prepare(`
    INSERT INTO bautizos (
      numero_bautizo,
      fecha_bautizo,
      tomo_bautizo,
      pagina_bautizo,
      lugar_bautizo,
      ministro,
      nombres_bautizado,
      apellidos_bautizado,
      lugar_nacimiento,
      fecha_nacimiento,
      nombre_padre,
      nombre_madre,
      padrino,
      madrina,
      cedula,
      anio_registro,
      tomo_registro,
      pagina_registro,
      acta_registro,
      lugar_registro,
      nota_marginal,
      parroco_nombre,
      pie_firma
    ) VALUES (
      @numero_bautizo,
      @fecha_bautizo,
      @tomo_bautizo,
      @pagina_bautizo,
      @lugar_bautizo,
      @ministro,
      @nombres_bautizado,
      @apellidos_bautizado,
      @lugar_nacimiento,
      @fecha_nacimiento,
      @nombre_padre,
      @nombre_madre,
      @padrino,
      @madrina,
      @cedula,
      @anio_registro,
      @tomo_registro,
      @pagina_registro,
      @acta_registro,
      @lugar_registro,
      @nota_marginal,
      @parroco_nombre,
      @pie_firma
    )
  `).run({

    numero_bautizo: datos.numero_bautizo.trim(),
    fecha_bautizo: datos.fecha_bautizo,
    tomo_bautizo: datos.tomo_bautizo || '',
    pagina_bautizo: datos.pagina_bautizo || '',
    lugar_bautizo: datos.lugar_bautizo.trim(),
    ministro: datos.ministro.trim(),

    nombres_bautizado: datos.nombres_bautizado.trim(),
    apellidos_bautizado: datos.apellidos_bautizado.trim(),
    lugar_nacimiento: datos.lugar_nacimiento || '',
    fecha_nacimiento: datos.fecha_nacimiento,

    nombre_padre: datos.nombre_padre || '',
    nombre_madre: datos.nombre_madre || '',
    padrino: datos.padrino || '',
    madrina: datos.madrina || '',

    cedula: datos.cedula || '',
    anio_registro: datos.anio_registro || '',
    tomo_registro: datos.tomo_registro || '',
    pagina_registro: datos.pagina_registro || '',
    acta_registro: datos.acta_registro || '',
    lugar_registro: datos.lugar_registro || '',

    nota_marginal:
      typeof datos.nota_marginal === 'string' &&
      datos.nota_marginal.trim()
        ? datos.nota_marginal.trim()
        : 'Ninguna',

    parroco_nombre: parroco?.parroco_nombre || '',
    pie_firma: parroco?.pie_firma || 'Párroco'
  });

  return {
    success: true,
    id: resultado.lastInsertRowid,
    message: 'Bautizo registrado correctamente.'
  };
}

// =====================================================
// LISTAR BAUTIZOS
// =====================================================

function listarBautizos(busqueda = '') {

  const termino = `%${String(busqueda).trim()}%`;

  return db.prepare(`
    SELECT
      id,
      numero_bautizo,
      fecha_bautizo,
      nombres_bautizado,
      apellidos_bautizado,
      cedula,
      lugar_bautizo
    FROM bautizos
    WHERE
      numero_bautizo LIKE ?
      OR nombres_bautizado LIKE ?
      OR apellidos_bautizado LIKE ?
      OR cedula LIKE ?
    ORDER BY fecha_bautizo DESC, id DESC
  `).all(termino, termino, termino, termino);
}

// =====================================================
// OBTENER UN BAUTIZO POR ID
// =====================================================

function obtenerBautizo(id) {
  return db.prepare(`
    SELECT *
    FROM bautizos
    WHERE id = ?
  `).get(Number(id)) || null;
}


// =====================================================
// ACTUALIZAR REGISTRO DE BAUTIZO
// =====================================================

function actualizarBautizo(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos del bautizo son inválidos.');
  }

  const id = Number(datos.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('El identificador del bautizo no es válido.');
  }

  const camposObligatorios = [
    'numero_bautizo',
    'fecha_bautizo',
    'lugar_bautizo',
    'ministro',
    'nombres_bautizado',
    'apellidos_bautizado',
    'fecha_nacimiento'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  const existente = db.prepare(`
    SELECT id
    FROM bautizos
    WHERE id = ?
  `).get(id);

  if (!existente) {
    throw new Error('No se encontró el bautizo que deseas modificar.');
  }

  // Evitar que otro registro tenga el mismo número.
  const numeroDuplicado = db.prepare(`
    SELECT id, numero_bautizo
    FROM bautizos
    WHERE
      UPPER(TRIM(numero_bautizo)) = UPPER(TRIM(?))
      AND id <> ?
    LIMIT 1
  `).get(datos.numero_bautizo, id);

  if (numeroDuplicado) {
    throw new Error(
      `El número de bautizo ${numeroDuplicado.numero_bautizo} ya pertenece a otro registro.`
    );
  }

  // Evitar duplicar la misma persona, fecha de nacimiento y bautismo.
  const personaDuplicada = db.prepare(`
    SELECT id, numero_bautizo
    FROM bautizos
    WHERE
      UPPER(TRIM(nombres_bautizado)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_bautizado)) = UPPER(TRIM(?))
      AND fecha_nacimiento = ?
      AND fecha_bautizo = ?
      AND id <> ?
    LIMIT 1
  `).get(
    datos.nombres_bautizado.trim(),
    datos.apellidos_bautizado.trim(),
    datos.fecha_nacimiento,
    datos.fecha_bautizo,
    id
  );

  if (personaDuplicada) {
    throw new Error(
      `Esta persona ya figura en otro bautizo con el número ${personaDuplicada.numero_bautizo}.`
    );
  }

  // Evitar que la misma cédula tenga otro registro en la misma fecha.
  if (datos.cedula && datos.cedula.trim()) {

    const cedulaDuplicada = db.prepare(`
      SELECT id, numero_bautizo
      FROM bautizos
      WHERE
        TRIM(cedula) = TRIM(?)
        AND fecha_bautizo = ?
        AND id <> ?
      LIMIT 1
    `).get(
      datos.cedula.trim(),
      datos.fecha_bautizo,
      id
    );

    if (cedulaDuplicada) {
      throw new Error(
        `La cédula ingresada ya está registrada en otro bautizo con el número ${cedulaDuplicada.numero_bautizo}.`
      );
    }
  }

  const resultado = db.prepare(`
    UPDATE bautizos
    SET
      numero_bautizo = @numero_bautizo,
      fecha_bautizo = @fecha_bautizo,
      tomo_bautizo = @tomo_bautizo,
      pagina_bautizo = @pagina_bautizo,
      lugar_bautizo = @lugar_bautizo,
      ministro = @ministro,

      nombres_bautizado = @nombres_bautizado,
      apellidos_bautizado = @apellidos_bautizado,
      lugar_nacimiento = @lugar_nacimiento,
      fecha_nacimiento = @fecha_nacimiento,

      nombre_padre = @nombre_padre,
      nombre_madre = @nombre_madre,
      padrino = @padrino,
      madrina = @madrina,

      cedula = @cedula,
      anio_registro = @anio_registro,
      tomo_registro = @tomo_registro,
      pagina_registro = @pagina_registro,
      acta_registro = @acta_registro,
      lugar_registro = @lugar_registro,

      nota_marginal = @nota_marginal,
      fecha_actualizacion = CURRENT_TIMESTAMP

    WHERE id = @id
  `).run({

    id,

    numero_bautizo: datos.numero_bautizo.trim(),
    fecha_bautizo: datos.fecha_bautizo,
    tomo_bautizo: datos.tomo_bautizo || '',
    pagina_bautizo: datos.pagina_bautizo || '',
    lugar_bautizo: datos.lugar_bautizo.trim(),
    ministro: datos.ministro.trim(),

    nombres_bautizado: datos.nombres_bautizado.trim(),
    apellidos_bautizado: datos.apellidos_bautizado.trim(),
    lugar_nacimiento: datos.lugar_nacimiento || '',
    fecha_nacimiento: datos.fecha_nacimiento,

    nombre_padre: datos.nombre_padre || '',
    nombre_madre: datos.nombre_madre || '',
    padrino: datos.padrino || '',
    madrina: datos.madrina || '',

    cedula: datos.cedula || '',
    anio_registro: datos.anio_registro || '',
    tomo_registro: datos.tomo_registro || '',
    pagina_registro: datos.pagina_registro || '',
    acta_registro: datos.acta_registro || '',
    lugar_registro: datos.lugar_registro || '',

    nota_marginal:
      typeof datos.nota_marginal === 'string' &&
      datos.nota_marginal.trim()
        ? datos.nota_marginal.trim()
        : 'Ninguna'
  });

  return {
    success: true,
    id,
    changes: resultado.changes,
    message: 'Bautizo actualizado correctamente.'
  };
}

// =====================================================
// BUSCAR BAUTISMO POR CÉDULA
// =====================================================

function buscarBautismoPorCedula(cedula) {

  if (typeof cedula !== 'string' || !cedula.trim()) {
    throw new Error('Ingresa una cédula válida.');
  }

  const lugaresPermitidos = [
    'San Rafael Arcángel de Muey',
    'Capilla Virgen del Cisne',
    'Capilla Santa Ana',
    'Capilla Divina Misericordia'
  ];

  const placeholders = lugaresPermitidos.map(() => '?').join(', ');

  const bautismo = db.prepare(`
    SELECT
      id,
      cedula,
      nombres_bautizado,
      apellidos_bautizado,
      lugar_nacimiento,
      fecha_nacimiento,
      nombre_padre,
      nombre_madre,
      lugar_bautizo,
      fecha_bautizo
    FROM bautizos
    WHERE
      TRIM(cedula) = TRIM(?)
      AND lugar_bautizo IN (${placeholders})
    ORDER BY id DESC
    LIMIT 1
  `).get(cedula.trim(), ...lugaresPermitidos);

  if (!bautismo) {
    return {
      success: true,
      encontrado: false,
      message: 'No se encontró un registro de bautismo en los archivos de esta parroquia y sus capillas.'
    };
  }

  return {
    success: true,
    encontrado: true,
    bautismo
  };
}

// =====================================================
// GUARDAR PRIMERA COMUNIÓN
// =====================================================

function guardarComunion(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos de la comunión son inválidos.');
  }

  const camposObligatorios = [
    'numero_comunion',
    'fecha_comunion',
    'lugar_comunion',
    'ministro',
    'nombres',
    'apellidos',
    'fecha_nacimiento'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  const existente = db.prepare(`
    SELECT id
    FROM comuniones
    WHERE UPPER(TRIM(numero_comunion)) =
          UPPER(TRIM(?))
    LIMIT 1
  `).get(datos.numero_comunion);

  if (existente) {
    throw new Error(
      `Ya existe una Primera Comunión registrada con el número ${datos.numero_comunion}.`
    );
  }

  const personaExistente = db.prepare(`
    SELECT id, numero_comunion
    FROM comuniones
    WHERE
      UPPER(TRIM(nombres)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos)) = UPPER(TRIM(?))
      AND fecha_nacimiento = ?
      AND fecha_comunion = ?
    LIMIT 1
  `).get(
    datos.nombres.trim(),
    datos.apellidos.trim(),
    datos.fecha_nacimiento,
    datos.fecha_comunion
  );

  if (personaExistente) {
    throw new Error(
      `Esta persona ya tiene una Primera Comunión registrada con el número ${personaExistente.numero_comunion}.`
    );
  }

  const parroco = obtenerParrocoVigente();

  if (!parroco || !parroco.parroco_nombre) {
    throw new Error(
      'No existe una configuración vigente del párroco en Mantenimiento.'
    );
  }

  const resultado = db.prepare(`
    INSERT INTO comuniones (
      numero_comunion,
      fecha_comunion,
      tomo_comunion,
      pagina_comunion,
      lugar_comunion,
      ministro,

      cedula,
      nombres,
      apellidos,
      lugar_nacimiento,
      fecha_nacimiento,

      parroquia_bautismo,
      fecha_bautismo,

      nombre_padre,
      nombre_madre,
      padrino,
      madrina,

      parroco_nombre,
      pie_firma,
      parroco_firma_data,
      parroco_firma_tipo
    ) VALUES (
      @numero_comunion,
      @fecha_comunion,
      @tomo_comunion,
      @pagina_comunion,
      @lugar_comunion,
      @ministro,

      @cedula,
      @nombres,
      @apellidos,
      @lugar_nacimiento,
      @fecha_nacimiento,

      @parroquia_bautismo,
      @fecha_bautismo,

      @nombre_padre,
      @nombre_madre,
      @padrino,
      @madrina,

      @parroco_nombre,
      @pie_firma,
      @parroco_firma_data,
      @parroco_firma_tipo
    )
  `).run({

    numero_comunion: datos.numero_comunion.trim(),
    fecha_comunion: datos.fecha_comunion,
    tomo_comunion: datos.tomo_comunion || '',
    pagina_comunion: datos.pagina_comunion || '',
    lugar_comunion: datos.lugar_comunion.trim(),
    ministro: datos.ministro.trim(),

    cedula: datos.cedula || '',
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    lugar_nacimiento: datos.lugar_nacimiento || '',
    fecha_nacimiento: datos.fecha_nacimiento,

    parroquia_bautismo: datos.parroquia_bautismo || '',
    fecha_bautismo: datos.fecha_bautismo || '',

    nombre_padre: datos.nombre_padre || '',
    nombre_madre: datos.nombre_madre || '',
    padrino: datos.padrino || '',
    madrina: datos.madrina || '',

    parroco_nombre: parroco.parroco_nombre || '',
    pie_firma: parroco.pie_firma || 'Párroco',
    parroco_firma_data: parroco.parroco_firma_data || '',
    parroco_firma_tipo: parroco.parroco_firma_tipo || ''
  });

  return {
    success: true,
    id: resultado.lastInsertRowid,
    message: 'Primera Comunión registrada correctamente.'
  };
}

// =====================================================
// LISTAR PRIMERAS COMUNIONES
// =====================================================

function listarComuniones(busqueda = '') {

  const termino = `%${String(busqueda).trim()}%`;

  return db.prepare(`
    SELECT
      id,
      numero_comunion,
      fecha_comunion,
      nombres,
      apellidos,
      cedula,
      lugar_comunion
    FROM comuniones
    WHERE
      numero_comunion LIKE ?
      OR nombres LIKE ?
      OR apellidos LIKE ?
      OR cedula LIKE ?
    ORDER BY fecha_comunion DESC, id DESC
  `).all(termino, termino, termino, termino);
}

// =====================================================
// OBTENER UNA PRIMERA COMUNIÓN POR ID
// =====================================================

function obtenerComunion(id) {
  return db.prepare(`
    SELECT *
    FROM comuniones
    WHERE id = ?
  `).get(Number(id)) || null;
}

// =====================================================
// BUSCAR ANTECEDENTES PARA CONFIRMACIÓN
// =====================================================

function buscarAntecedentesConfirmacion(cedula) {

  if (typeof cedula !== 'string' || !cedula.trim()) {
    throw new Error('Ingresa una cédula válida.');
  }

  const numeroCedula = cedula.trim();

  const lugaresPermitidos = [
    'San Rafael Arcángel de Muey',
    'Capilla Virgen del Cisne',
    'Capilla Santa Ana',
    'Capilla Divina Misericordia'
  ];

  const placeholders = lugaresPermitidos.map(() => '?').join(', ');

  const bautismo = db.prepare(`
    SELECT
      id,
      cedula,
      nombres_bautizado,
      apellidos_bautizado,
      lugar_nacimiento,
      fecha_nacimiento,
      nombre_padre,
      nombre_madre,
      lugar_bautizo,
      fecha_bautizo
    FROM bautizos
    WHERE
      TRIM(cedula) = TRIM(?)
      AND lugar_bautizo IN (${placeholders})
    ORDER BY id DESC
    LIMIT 1
  `).get(numeroCedula, ...lugaresPermitidos) || null;

  const comunion = db.prepare(`
    SELECT
      id,
      cedula,
      nombres,
      apellidos,
      lugar_nacimiento,
      fecha_nacimiento,
      parroquia_bautismo,
      fecha_bautismo,
      nombre_padre,
      nombre_madre
    FROM comuniones
    WHERE TRIM(cedula) = TRIM(?)
    ORDER BY id DESC
    LIMIT 1
  `).get(numeroCedula) || null;

  const datos = {
    cedula: numeroCedula,

    nombres:
      bautismo?.nombres_bautizado ||
      comunion?.nombres ||
      '',

    apellidos:
      bautismo?.apellidos_bautizado ||
      comunion?.apellidos ||
      '',

    lugar_nacimiento:
      bautismo?.lugar_nacimiento ||
      comunion?.lugar_nacimiento ||
      '',

    fecha_nacimiento:
      bautismo?.fecha_nacimiento ||
      comunion?.fecha_nacimiento ||
      '',

    parroquia_bautismo:
      bautismo?.lugar_bautizo ||
      comunion?.parroquia_bautismo ||
      '',

    fecha_bautismo:
      bautismo?.fecha_bautizo ||
      comunion?.fecha_bautismo ||
      '',

    nombre_padre:
      bautismo?.nombre_padre ||
      comunion?.nombre_padre ||
      '',

    nombre_madre:
      bautismo?.nombre_madre ||
      comunion?.nombre_madre ||
      ''
  };

  return {
    success: true,
    bautismoEncontrado: !!bautismo,
    comunionEncontrada: !!comunion,
    encontrado: !!(bautismo || comunion),
    bautismo,
    comunion,
    datos,
    message: bautismo || comunion
      ? 'Se encontraron antecedentes sacramentales.'
      : 'No se encontraron registros locales. Puedes completar los datos manualmente.'
  };
}

// =====================================================
// GUARDAR CONFIRMACIÓN
// =====================================================

function guardarConfirmacion(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos de la Confirmación son inválidos.');
  }

  const camposObligatorios = [
    'numero_confirmacion',
    'fecha_confirmacion',
    'lugar_confirmacion',
    'ministro',
    'nombres',
    'apellidos',
    'fecha_nacimiento'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  const existente = db.prepare(`
    SELECT id
    FROM confirmaciones
    WHERE
      UPPER(TRIM(numero_confirmacion)) =
      UPPER(TRIM(?))
    LIMIT 1
  `).get(datos.numero_confirmacion);

  if (existente) {
    throw new Error(
      `Ya existe una Confirmación registrada con el número ${datos.numero_confirmacion}.`
    );
  }

  const personaExistente = db.prepare(`
    SELECT id, numero_confirmacion
    FROM confirmaciones
    WHERE
      UPPER(TRIM(nombres)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos)) = UPPER(TRIM(?))
      AND fecha_nacimiento = ?
      AND fecha_confirmacion = ?
    LIMIT 1
  `).get(
    datos.nombres.trim(),
    datos.apellidos.trim(),
    datos.fecha_nacimiento,
    datos.fecha_confirmacion
  );

  if (personaExistente) {
    throw new Error(
      `Esta persona ya tiene una Confirmación registrada con el número ${personaExistente.numero_confirmacion}.`
    );
  }

  const parroco = obtenerParrocoVigente();

  if (!parroco || !parroco.parroco_nombre) {
    throw new Error(
      'No existe una configuración vigente del párroco en Mantenimiento.'
    );
  }

  const resultado = db.prepare(`
    INSERT INTO confirmaciones (
      numero_confirmacion,
      fecha_confirmacion,
      tomo_confirmacion,
      pagina_confirmacion,
      lugar_confirmacion,
      ministro,

      cedula,
      nombres,
      apellidos,
      lugar_nacimiento,
      fecha_nacimiento,

      parroquia_bautismo,
      fecha_bautismo,

      nombre_padre,
      nombre_madre,
      nombre_padrino,
      nombre_madrina,

      parroco_nombre,
      pie_firma,
      parroco_firma_data,
      parroco_firma_tipo
    ) VALUES (
      @numero_confirmacion,
      @fecha_confirmacion,
      @tomo_confirmacion,
      @pagina_confirmacion,
      @lugar_confirmacion,
      @ministro,

      @cedula,
      @nombres,
      @apellidos,
      @lugar_nacimiento,
      @fecha_nacimiento,

      @parroquia_bautismo,
      @fecha_bautismo,

      @nombre_padre,
      @nombre_madre,
      @nombre_padrino,
      @nombre_madrina,

      @parroco_nombre,
      @pie_firma,
      @parroco_firma_data,
      @parroco_firma_tipo
    )
  `).run({

    numero_confirmacion: datos.numero_confirmacion.trim(),
    fecha_confirmacion: datos.fecha_confirmacion,
    tomo_confirmacion: datos.tomo_confirmacion || '',
    pagina_confirmacion: datos.pagina_confirmacion || '',
    lugar_confirmacion: datos.lugar_confirmacion.trim(),
    ministro: datos.ministro.trim(),

    cedula: datos.cedula || '',
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    lugar_nacimiento: datos.lugar_nacimiento || '',
    fecha_nacimiento: datos.fecha_nacimiento,

    parroquia_bautismo: datos.parroquia_bautismo || '',
    fecha_bautismo: datos.fecha_bautismo || '',

    nombre_padre: datos.nombre_padre || '',
    nombre_madre: datos.nombre_madre || '',
    nombre_padrino: datos.nombre_padrino || '',
    nombre_madrina: datos.nombre_madrina || '',

    parroco_nombre: parroco.parroco_nombre || '',
    pie_firma: parroco.pie_firma || 'Párroco',
    parroco_firma_data: parroco.parroco_firma_data || '',
    parroco_firma_tipo: parroco.parroco_firma_tipo || ''
  });

  return {
    success: true,
    id: resultado.lastInsertRowid,
    message: 'Confirmación registrada correctamente.'
  };
}

// =====================================================
// LISTAR CONFIRMACIONES
// =====================================================

function listarConfirmaciones(busqueda = '') {

  const termino = `%${String(busqueda).trim()}%`;

  return db.prepare(`
    SELECT
      id,
      numero_confirmacion,
      fecha_confirmacion,
      nombres,
      apellidos,
      cedula,
      lugar_confirmacion
    FROM confirmaciones
    WHERE
      numero_confirmacion LIKE ?
      OR nombres LIKE ?
      OR apellidos LIKE ?
      OR cedula LIKE ?
    ORDER BY fecha_confirmacion DESC, id DESC
  `).all(termino, termino, termino, termino);
}

// =====================================================
// OBTENER UNA CONFIRMACIÓN POR ID
// =====================================================

function obtenerConfirmacion(id) {
  return db.prepare(`
    SELECT *
    FROM confirmaciones
    WHERE id = ?
  `).get(Number(id)) || null;
}

// =====================================================
// ACTUALIZAR CONFIRMACIÓN
// =====================================================

function actualizarConfirmacion(datos) {

  if (!datos || !datos.id) {
    throw new Error('No se recibió el identificador de la confirmación.');
  }

  const consulta = db.prepare(`
    UPDATE confirmaciones SET
      numero_confirmacion = @numero_confirmacion,
      fecha_confirmacion = @fecha_confirmacion,
      tomo_confirmacion = @tomo_confirmacion,
      pagina_confirmacion = @pagina_confirmacion,
      lugar_confirmacion = @lugar_confirmacion,
      ministro = @ministro,

      cedula = @cedula,
      nombres = @nombres,
      apellidos = @apellidos,
      lugar_nacimiento = @lugar_nacimiento,
      fecha_nacimiento = @fecha_nacimiento,

      parroquia_bautismo = @parroquia_bautismo,
      fecha_bautismo = @fecha_bautismo,

      nombre_padre = @nombre_padre,
      nombre_madre = @nombre_madre,
      nombre_padrino = @nombre_padrino,
      nombre_madrina = @nombre_madrina,

      fecha_actualizacion = CURRENT_TIMESTAMP

    WHERE id = @id
  `);

  const resultado = consulta.run({
    id: Number(datos.id),

    numero_confirmacion: datos.numero_confirmacion ?? '',
    fecha_confirmacion: datos.fecha_confirmacion ?? null,
    tomo_confirmacion: datos.tomo_confirmacion ?? '',
    pagina_confirmacion: datos.pagina_confirmacion ?? '',
    lugar_confirmacion: datos.lugar_confirmacion ?? '',
    ministro: datos.ministro ?? '',

    cedula: datos.cedula ?? '',
    nombres: datos.nombres ?? '',
    apellidos: datos.apellidos ?? '',
    lugar_nacimiento: datos.lugar_nacimiento ?? '',
    fecha_nacimiento: datos.fecha_nacimiento || null,

    parroquia_bautismo: datos.parroquia_bautismo ?? '',
    fecha_bautismo: datos.fecha_bautismo || null,

    nombre_padre: datos.nombre_padre ?? '',
    nombre_madre: datos.nombre_madre ?? '',
    nombre_padrino: datos.nombre_padrino ?? '',
    nombre_madrina: datos.nombre_madrina ?? ''
  });

  if (resultado.changes === 0) {
    throw new Error('No se encontró la confirmación que deseas actualizar.');
  }

  return {
    success: true,
    changes: resultado.changes,
    id: Number(datos.id)
  };
}

// =====================================================
// GUARDAR REGISTRO DE MATRIMONIO
// =====================================================

function guardarMatrimonio(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos del matrimonio son inválidos.');
  }

  const camposObligatorios = [
    'numero_matrimonio',
    'fecha_matrimonio',
    'lugar_matrimonio',
    'ministro',
    'nombres_esposo',
    'apellidos_esposo',
    'nombres_esposa',
    'apellidos_esposa'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  // ---------------------------------------------------
  // VALIDAR NÚMERO DUPLICADO
  // ---------------------------------------------------

  const existente = db.prepare(`
    SELECT id, numero_matrimonio
    FROM matrimonios
    WHERE UPPER(TRIM(numero_matrimonio)) =
          UPPER(TRIM(?))
    LIMIT 1
  `).get(datos.numero_matrimonio);

  if (existente) {
    throw new Error(
      `Ya existe un matrimonio registrado con el número ${existente.numero_matrimonio}.`
    );
  }

  // ---------------------------------------------------
  // VALIDAR PAREJA DUPLICADA
  // ---------------------------------------------------

  const parejaExistente = db.prepare(`
    SELECT id, numero_matrimonio
    FROM matrimonios
    WHERE
      UPPER(TRIM(nombres_esposo)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_esposo)) = UPPER(TRIM(?))
      AND UPPER(TRIM(nombres_esposa)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_esposa)) = UPPER(TRIM(?))
      AND fecha_matrimonio = ?
    LIMIT 1
  `).get(
    datos.nombres_esposo.trim(),
    datos.apellidos_esposo.trim(),
    datos.nombres_esposa.trim(),
    datos.apellidos_esposa.trim(),
    datos.fecha_matrimonio
  );

  if (parejaExistente) {
    throw new Error(
      `Esta pareja ya tiene un matrimonio registrado con el número ${parejaExistente.numero_matrimonio}.`
    );
  }

  // ---------------------------------------------------
  // OBTENER CONFIGURACIÓN VIGENTE DEL PÁRROCO
  // ---------------------------------------------------

  const parroco = obtenerParrocoVigente();

  if (!parroco || !parroco.parroco_nombre) {
    throw new Error(
      'No existe una configuración vigente del párroco en Mantenimiento.'
    );
  }

  // ---------------------------------------------------
  // INSERTAR MATRIMONIO
  // ---------------------------------------------------

  const resultado = db.prepare(`
    INSERT INTO matrimonios (
      numero_matrimonio,
      fecha_matrimonio,
      tomo_matrimonio,
      pagina_matrimonio,
      lugar_matrimonio,
      ministro,

      nombres_esposo,
      apellidos_esposo,
      cedula_esposo,
      fecha_nacimiento_esposo,
      lugar_nacimiento_esposo,
      nombre_padre_esposo,
      nombre_madre_esposo,
      parroquia_bautismo_esposo,

      nombres_esposa,
      apellidos_esposa,
      cedula_esposa,
      fecha_nacimiento_esposa,
      lugar_nacimiento_esposa,
      nombre_padre_esposa,
      nombre_madre_esposa,
      parroquia_bautismo_esposa,

      testigo_1,
      testigo_2,
      padrinos_boda,

      anio_registro_civil,
      libro_registro_civil,
      folio_registro_civil,
      acta_registro_civil,
      observacion,

      parroco_nombre,
      pie_firma,
      parroco_firma_data,
      parroco_firma_tipo
    ) VALUES (
      @numero_matrimonio,
      @fecha_matrimonio,
      @tomo_matrimonio,
      @pagina_matrimonio,
      @lugar_matrimonio,
      @ministro,

      @nombres_esposo,
      @apellidos_esposo,
      @cedula_esposo,
      @fecha_nacimiento_esposo,
      @lugar_nacimiento_esposo,
      @nombre_padre_esposo,
      @nombre_madre_esposo,
      @parroquia_bautismo_esposo,

      @nombres_esposa,
      @apellidos_esposa,
      @cedula_esposa,
      @fecha_nacimiento_esposa,
      @lugar_nacimiento_esposa,
      @nombre_padre_esposa,
      @nombre_madre_esposa,
      @parroquia_bautismo_esposa,

      @testigo_1,
      @testigo_2,
      @padrinos_boda,

      @anio_registro_civil,
      @libro_registro_civil,
      @folio_registro_civil,
      @acta_registro_civil,
      @observacion,

      @parroco_nombre,
      @pie_firma,
      @parroco_firma_data,
      @parroco_firma_tipo
    )
  `).run({

    numero_matrimonio: datos.numero_matrimonio.trim(),
    fecha_matrimonio: datos.fecha_matrimonio,
    tomo_matrimonio: datos.tomo_matrimonio || '',
    pagina_matrimonio: datos.pagina_matrimonio || '',
    lugar_matrimonio: datos.lugar_matrimonio.trim(),
    ministro: datos.ministro.trim(),

    nombres_esposo: datos.nombres_esposo.trim(),
    apellidos_esposo: datos.apellidos_esposo.trim(),
    cedula_esposo: datos.cedula_esposo || '',
    fecha_nacimiento_esposo: datos.fecha_nacimiento_esposo || '',
    lugar_nacimiento_esposo: datos.lugar_nacimiento_esposo || '',
    nombre_padre_esposo: datos.nombre_padre_esposo || '',
    nombre_madre_esposo: datos.nombre_madre_esposo || '',
    parroquia_bautismo_esposo: datos.parroquia_bautismo_esposo || '',

    nombres_esposa: datos.nombres_esposa.trim(),
    apellidos_esposa: datos.apellidos_esposa.trim(),
    cedula_esposa: datos.cedula_esposa || '',
    fecha_nacimiento_esposa: datos.fecha_nacimiento_esposa || '',
    lugar_nacimiento_esposa: datos.lugar_nacimiento_esposa || '',
    nombre_padre_esposa: datos.nombre_padre_esposa || '',
    nombre_madre_esposa: datos.nombre_madre_esposa || '',
    parroquia_bautismo_esposa: datos.parroquia_bautismo_esposa || '',

    testigo_1: datos.testigo_1 || '',
    testigo_2: datos.testigo_2 || '',
    padrinos_boda: datos.padrinos_boda || '',

    anio_registro_civil: datos.anio_registro_civil || '',
    libro_registro_civil: datos.libro_registro_civil || '',
    folio_registro_civil: datos.folio_registro_civil || '',
    acta_registro_civil: datos.acta_registro_civil || '',

    observacion:
      typeof datos.observacion === 'string' &&
      datos.observacion.trim()
        ? datos.observacion.trim()
        : 'Ninguna',

    // COPIA HISTÓRICA DE LA FIRMA
    parroco_nombre: parroco.parroco_nombre,
    pie_firma: parroco.pie_firma || 'Párroco',
    parroco_firma_data: parroco.parroco_firma_data || '',
    parroco_firma_tipo: parroco.parroco_firma_tipo || ''
  });

  return {
    success: true,
    id: resultado.lastInsertRowid,
    message: 'Matrimonio registrado correctamente.'
  };
}

// =====================================================
// LISTAR MATRIMONIOS
// =====================================================

function listarMatrimonios(busqueda = '') {

  const termino = `%${String(busqueda).trim()}%`;

  return db.prepare(`
    SELECT
      id,
      numero_matrimonio,
      fecha_matrimonio,
      nombres_esposo,
      apellidos_esposo,
      nombres_esposa,
      apellidos_esposa,
      cedula_esposo,
      cedula_esposa,
      lugar_matrimonio
    FROM matrimonios
    WHERE
      numero_matrimonio LIKE ?
      OR nombres_esposo LIKE ?
      OR apellidos_esposo LIKE ?
      OR nombres_esposa LIKE ?
      OR apellidos_esposa LIKE ?
      OR cedula_esposo LIKE ?
      OR cedula_esposa LIKE ?
    ORDER BY fecha_matrimonio DESC, id DESC
  `).all(
    termino,
    termino,
    termino,
    termino,
    termino,
    termino,
    termino
  );
}

// =====================================================
// OBTENER MATRIMONIO POR ID
// =====================================================

function obtenerMatrimonio(id) {

  return db.prepare(`
    SELECT *
    FROM matrimonios
    WHERE id = ?
  `).get(Number(id)) || null;
}

// =====================================================
// ACTUALIZAR REGISTRO DE MATRIMONIO
// =====================================================

function actualizarMatrimonio(datos) {

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new Error('Los datos del matrimonio son inválidos.');
  }

  const id = Number(datos.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('El identificador del matrimonio es inválido.');
  }

  const matrimonioExistente = db.prepare(`
    SELECT id
    FROM matrimonios
    WHERE id = ?
  `).get(id);

  if (!matrimonioExistente) {
    throw new Error('No se encontró el matrimonio que deseas actualizar.');
  }

  const camposObligatorios = [
    'numero_matrimonio',
    'fecha_matrimonio',
    'lugar_matrimonio',
    'ministro',
    'nombres_esposo',
    'apellidos_esposo',
    'nombres_esposa',
    'apellidos_esposa'
  ];

  for (const campo of camposObligatorios) {
    if (
      typeof datos[campo] !== 'string' ||
      !datos[campo].trim()
    ) {
      throw new Error(`El campo ${campo} es obligatorio.`);
    }
  }

  // ---------------------------------------------------
  // VALIDAR NÚMERO DUPLICADO
  // ---------------------------------------------------

  const numeroExistente = db.prepare(`
    SELECT id
    FROM matrimonios
    WHERE
      UPPER(TRIM(numero_matrimonio)) =
      UPPER(TRIM(?))
      AND id <> ?
    LIMIT 1
  `).get(datos.numero_matrimonio, id);

  if (numeroExistente) {
    throw new Error(
      `Ya existe otro matrimonio registrado con el número ${datos.numero_matrimonio}.`
    );
  }

  // ---------------------------------------------------
  // VALIDAR PAREJA DUPLICADA
  // ---------------------------------------------------

  const parejaExistente = db.prepare(`
    SELECT id, numero_matrimonio
    FROM matrimonios
    WHERE
      UPPER(TRIM(nombres_esposo)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_esposo)) = UPPER(TRIM(?))
      AND UPPER(TRIM(nombres_esposa)) = UPPER(TRIM(?))
      AND UPPER(TRIM(apellidos_esposa)) = UPPER(TRIM(?))
      AND fecha_matrimonio = ?
      AND id <> ?
    LIMIT 1
  `).get(
    datos.nombres_esposo.trim(),
    datos.apellidos_esposo.trim(),
    datos.nombres_esposa.trim(),
    datos.apellidos_esposa.trim(),
    datos.fecha_matrimonio,
    id
  );

  if (parejaExistente) {
    throw new Error(
      `Esta pareja ya tiene otro matrimonio registrado con el número ${parejaExistente.numero_matrimonio}.`
    );
  }

  // ---------------------------------------------------
  // ACTUALIZAR DATOS
  // LA FIRMA HISTÓRICA NO SE MODIFICA
  // ---------------------------------------------------

  const resultado = db.prepare(`
    UPDATE matrimonios SET

      numero_matrimonio = @numero_matrimonio,
      fecha_matrimonio = @fecha_matrimonio,
      tomo_matrimonio = @tomo_matrimonio,
      pagina_matrimonio = @pagina_matrimonio,
      lugar_matrimonio = @lugar_matrimonio,
      ministro = @ministro,

      nombres_esposo = @nombres_esposo,
      apellidos_esposo = @apellidos_esposo,
      cedula_esposo = @cedula_esposo,
      fecha_nacimiento_esposo = @fecha_nacimiento_esposo,
      lugar_nacimiento_esposo = @lugar_nacimiento_esposo,
      nombre_padre_esposo = @nombre_padre_esposo,
      nombre_madre_esposo = @nombre_madre_esposo,
      parroquia_bautismo_esposo = @parroquia_bautismo_esposo,

      nombres_esposa = @nombres_esposa,
      apellidos_esposa = @apellidos_esposa,
      cedula_esposa = @cedula_esposa,
      fecha_nacimiento_esposa = @fecha_nacimiento_esposa,
      lugar_nacimiento_esposa = @lugar_nacimiento_esposa,
      nombre_padre_esposa = @nombre_padre_esposa,
      nombre_madre_esposa = @nombre_madre_esposa,
      parroquia_bautismo_esposa = @parroquia_bautismo_esposa,

      testigo_1 = @testigo_1,
      testigo_2 = @testigo_2,
      padrinos_boda = @padrinos_boda,

      anio_registro_civil = @anio_registro_civil,
      libro_registro_civil = @libro_registro_civil,
      folio_registro_civil = @folio_registro_civil,
      acta_registro_civil = @acta_registro_civil,

      observacion = @observacion,

      fecha_actualizacion = CURRENT_TIMESTAMP

    WHERE id = @id
  `).run({

    id,

    numero_matrimonio: datos.numero_matrimonio.trim(),
    fecha_matrimonio: datos.fecha_matrimonio,
    tomo_matrimonio: datos.tomo_matrimonio || '',
    pagina_matrimonio: datos.pagina_matrimonio || '',
    lugar_matrimonio: datos.lugar_matrimonio.trim(),
    ministro: datos.ministro.trim(),

    nombres_esposo: datos.nombres_esposo.trim(),
    apellidos_esposo: datos.apellidos_esposo.trim(),
    cedula_esposo: datos.cedula_esposo || '',
    fecha_nacimiento_esposo: datos.fecha_nacimiento_esposo || '',
    lugar_nacimiento_esposo: datos.lugar_nacimiento_esposo || '',
    nombre_padre_esposo: datos.nombre_padre_esposo || '',
    nombre_madre_esposo: datos.nombre_madre_esposo || '',
    parroquia_bautismo_esposo: datos.parroquia_bautismo_esposo || '',

    nombres_esposa: datos.nombres_esposa.trim(),
    apellidos_esposa: datos.apellidos_esposa.trim(),
    cedula_esposa: datos.cedula_esposa || '',
    fecha_nacimiento_esposa: datos.fecha_nacimiento_esposa || '',
    lugar_nacimiento_esposa: datos.lugar_nacimiento_esposa || '',
    nombre_padre_esposa: datos.nombre_padre_esposa || '',
    nombre_madre_esposa: datos.nombre_madre_esposa || '',
    parroquia_bautismo_esposa: datos.parroquia_bautismo_esposa || '',

    testigo_1: datos.testigo_1 || '',
    testigo_2: datos.testigo_2 || '',
    padrinos_boda: datos.padrinos_boda || '',

    anio_registro_civil: datos.anio_registro_civil || '',
    libro_registro_civil: datos.libro_registro_civil || '',
    folio_registro_civil: datos.folio_registro_civil || '',
    acta_registro_civil: datos.acta_registro_civil || '',

    observacion:
      typeof datos.observacion === 'string' &&
      datos.observacion.trim()
        ? datos.observacion.trim()
        : 'Ninguna'
  });

  return {
    success: true,
    id,
    changes: resultado.changes,
    message: 'Matrimonio actualizado correctamente.'
  };
}


// =====================================================
// EXPORTAR RESPALDO COMPLETO Y CONSISTENTE
// =====================================================

function exportarRespaldoCompleto() {

  if (!db) {
    throw new Error('La base de datos no está inicializada.');
  }

  // Las seis tablas se leen dentro de una misma transacción.
  // Así evitamos obtener registros de momentos diferentes.

  const obtenerDatos = db.transaction(() => {

    return {

      usuarios: db.prepare(`
        SELECT * FROM usuarios ORDER BY id
      `).all(),

      configuracion_parroquial: db.prepare(`
        SELECT * FROM configuracion_parroquial ORDER BY id
      `).all(),

      bautizos: db.prepare(`
        SELECT * FROM bautizos ORDER BY id
      `).all(),

      comuniones: db.prepare(`
        SELECT * FROM comuniones ORDER BY id
      `).all(),

      confirmaciones: db.prepare(`
        SELECT * FROM confirmaciones ORDER BY id
      `).all(),

      matrimonios: db.prepare(`
        SELECT * FROM matrimonios ORDER BY id
      `).all()

    };

  });

  const tablas = obtenerDatos();

  const respaldo = {

    formato: 'IGLESIA_RESPALDO',

    version: 1,

    generadoEn: new Date().toISOString(),

    tablas

  };

  // Huella de integridad SHA-256.

  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(respaldo), 'utf8')
    .digest('hex');

  return {

    ...respaldo,

    checksum

  };

}


// =====================================================
// EXPORTAR FUNCIONES
// =====================================================

module.exports = {
  initializeDatabase,
  autenticarUsuario,

  obtenerParrocoVigente,
  guardarParrocoVigente,

  guardarBautizo,
  listarBautizos,
  obtenerBautizo,
  actualizarBautizo,
  buscarBautismoPorCedula,

  guardarComunion,
  listarComuniones,
  obtenerComunion,

  buscarAntecedentesConfirmacion,
  guardarConfirmacion,
  listarConfirmaciones,
  obtenerConfirmacion,
  actualizarConfirmacion,

  guardarMatrimonio,
  listarMatrimonios,
  obtenerMatrimonio,
  actualizarMatrimonio,

  // Respaldo completo
  exportarRespaldoCompleto
};