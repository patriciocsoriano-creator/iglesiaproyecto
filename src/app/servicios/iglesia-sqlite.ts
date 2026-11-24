
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class IglesiaSqliteService {

  private readonly nombreBaseDatos = 'iglesia';
  private readonly versionBaseDatos = 1;

  private sqlite: SQLiteConnection;
  private conexion?: SQLiteDBConnection;
  private inicializacion?: Promise<void>;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  // =====================================================
  // COMPROBAR SI ESTAMOS EN ANDROID O IOS
  // =====================================================

  esDispositivoMovil(): boolean {
    return Capacitor.isNativePlatform();
  }

  // =====================================================
  // INICIALIZAR BASE DE DATOS
  // =====================================================

  async inicializar(): Promise<void> {

    if (!this.esDispositivoMovil()) {
      throw new Error(
        'Esta base de datos está destinada a Android y iOS.'
      );
    }

    if (this.conexion) {
      return;
    }

    if (this.inicializacion) {
      return this.inicializacion;
    }

    this.inicializacion = this.crearConexion();

    try {
      await this.inicializacion;
    } catch (error) {
      this.inicializacion = undefined;
      throw error;
    }
  }

  private async crearConexion(): Promise<void> {

    this.conexion = await this.sqlite.createConnection(
      this.nombreBaseDatos,
      false,
      'no-encryption',
      this.versionBaseDatos,
      false
    );

    await this.conexion.open();

    await this.conexion.execute(
      'PRAGMA foreign_keys = ON;'
    );

    await this.crearTablas();

    console.log('Base de datos móvil inicializada correctamente.');
  }

  // =====================================================
  // CREAR TABLAS
  // =====================================================

  private async crearTablas(): Promise<void> {

    if (!this.conexion) {
      throw new Error('No existe una conexión SQLite activa.');
    }

    const tablas = [

      // -------------------------------------------------
      // USUARIOS
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL UNIQUE,
        nombre_completo TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'administrador',
        activo INTEGER NOT NULL DEFAULT 1,
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      // -------------------------------------------------
      // CONFIGURACIÓN PARROQUIAL
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS configuracion_parroquial (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        parroco_nombre TEXT NOT NULL DEFAULT '',
        pie_firma TEXT NOT NULL DEFAULT 'Párroco',
        fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        parroco_firma_data TEXT NOT NULL DEFAULT '',
        parroco_firma_tipo TEXT NOT NULL DEFAULT '',
        diocesis_nombre TEXT NOT NULL DEFAULT 'Diócesis de Santa Elena',
        vicaria_nombre TEXT NOT NULL DEFAULT 'Vicaría San José',
        parroquia_nombre TEXT NOT NULL DEFAULT '',
        logo_diocesis_data TEXT NOT NULL DEFAULT '',
        logo_diocesis_tipo TEXT NOT NULL DEFAULT '',
        logo_parroquia_data TEXT NOT NULL DEFAULT '',
        logo_parroquia_tipo TEXT NOT NULL DEFAULT '',
        sello_parroquia_data TEXT NOT NULL DEFAULT '',
        sello_parroquia_tipo TEXT NOT NULL DEFAULT ''
      );`,

      // -------------------------------------------------
      // BAUTIZOS
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS bautizos (
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
      );`,

      // -------------------------------------------------
      // PRIMERAS COMUNIONES
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS comuniones (
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
      );`,

      // -------------------------------------------------
      // CONFIRMACIONES
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS confirmaciones (
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
      );`,

      // -------------------------------------------------
      // MATRIMONIOS
      // -------------------------------------------------

      `CREATE TABLE IF NOT EXISTS matrimonios (
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
        parroquia_bautismo_esposo TEXT NOT NULL DEFAULT '',

        nombres_esposa TEXT NOT NULL,
        apellidos_esposa TEXT NOT NULL,
        cedula_esposa TEXT NOT NULL DEFAULT '',
        fecha_nacimiento_esposa TEXT NOT NULL DEFAULT '',
        lugar_nacimiento_esposa TEXT NOT NULL DEFAULT '',
        nombre_padre_esposa TEXT NOT NULL DEFAULT '',
        nombre_madre_esposa TEXT NOT NULL DEFAULT '',
        parroquia_bautismo_esposa TEXT NOT NULL DEFAULT '',

        testigo_1 TEXT NOT NULL DEFAULT '',
        testigo_2 TEXT NOT NULL DEFAULT '',
        padrinos_boda TEXT NOT NULL DEFAULT '',

        anio_registro_civil TEXT NOT NULL DEFAULT '',
        libro_registro_civil TEXT NOT NULL DEFAULT '',
        folio_registro_civil TEXT NOT NULL DEFAULT '',
        acta_registro_civil TEXT NOT NULL DEFAULT '',
        observacion TEXT NOT NULL DEFAULT 'Ninguna',

        parroco_nombre TEXT NOT NULL DEFAULT '',
        pie_firma TEXT NOT NULL DEFAULT 'Párroco',
        parroco_firma_data TEXT NOT NULL DEFAULT '',
        parroco_firma_tipo TEXT NOT NULL DEFAULT '',

        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,

      // -------------------------------------------------
      // ÍNDICES
      // -------------------------------------------------

      `CREATE INDEX IF NOT EXISTS idx_bautizos_numero
        ON bautizos(numero_bautizo);`,

      `CREATE INDEX IF NOT EXISTS idx_bautizos_apellidos
        ON bautizos(apellidos_bautizado);`,

      `CREATE INDEX IF NOT EXISTS idx_bautizos_cedula
        ON bautizos(cedula);`,

      `CREATE INDEX IF NOT EXISTS idx_comuniones_cedula
        ON comuniones(cedula);`,

      `CREATE INDEX IF NOT EXISTS idx_comuniones_apellidos
        ON comuniones(apellidos);`,

      `CREATE INDEX IF NOT EXISTS idx_confirmaciones_cedula
        ON confirmaciones(cedula);`,

      `CREATE INDEX IF NOT EXISTS idx_confirmaciones_apellidos
        ON confirmaciones(apellidos);`,

      `CREATE INDEX IF NOT EXISTS idx_matrimonios_numero
        ON matrimonios(numero_matrimonio);`,

      `CREATE INDEX IF NOT EXISTS idx_matrimonios_esposo
        ON matrimonios(apellidos_esposo);`,

      `CREATE INDEX IF NOT EXISTS idx_matrimonios_esposa
        ON matrimonios(apellidos_esposa);`,

      `CREATE INDEX IF NOT EXISTS idx_matrimonios_cedula_esposo
        ON matrimonios(cedula_esposo);`,

      `CREATE INDEX IF NOT EXISTS idx_matrimonios_cedula_esposa
        ON matrimonios(cedula_esposa);`

    ];

    for (const sql of tablas) {
      await this.conexion.execute(sql);
    }

    // Crear configuración parroquial inicial si no existe.
    await this.conexion.run(
      `INSERT OR IGNORE INTO configuracion_parroquial (
        id,
        parroco_nombre,
        pie_firma,
        parroco_firma_data,
        parroco_firma_tipo
      ) VALUES (1, '', 'Párroco', '', '');`
    );

    console.log('Tablas móviles creadas correctamente.');
  }

  // =====================================================
  // EJECUTAR CONSULTAS
  // =====================================================

  async ejecutar(sql: string): Promise<void> {

    await this.inicializar();

    if (!this.conexion) {
      throw new Error('No existe una conexión SQLite activa.');
    }

    await this.conexion.execute(sql);
  }

  // =====================================================
  // INSERTAR / ACTUALIZAR REGISTROS
  // =====================================================

  async ejecutarCambios(
    sql: string,
    valores: any[] = []
  ): Promise<any> {

    await this.inicializar();

    if (!this.conexion) {
      throw new Error('No existe una conexión SQLite activa.');
    }

    return await this.conexion.run(sql, valores);
  }

  // =====================================================
  // CONSULTAR REGISTROS
  // =====================================================

  async consultar(
    sql: string,
    valores: any[] = []
  ): Promise<any[]> {

    await this.inicializar();

    if (!this.conexion) {
      throw new Error('No existe una conexión SQLite activa.');
    }

    const resultado = await this.conexion.query(sql, valores);

    return resultado.values ?? [];
  }


// =====================================================
// IMPORTAR RESPALDO DESDE ARCHIVO JSON
// =====================================================

async importarArchivo(archivo: File): Promise<any> {

  if (!archivo) {
    throw new Error('No se seleccionó ningún archivo.');
  }

  if (archivo.size > 100 * 1024 * 1024) {
    throw new Error(
      'El respaldo supera el límite permitido de 100 MB.'
    );
  }

  const contenido = await archivo.text();

  return this.importarRespaldo(contenido);
}


// =====================================================
// VALIDAR E IMPORTAR RESPALDO
// =====================================================

async importarRespaldo(contenido: string): Promise<any> {

  await this.inicializar();

  if (!this.conexion) {
    throw new Error('No existe conexión con SQLite.');
  }

  let respaldo: any;

  try {
    respaldo = JSON.parse(contenido);
  } catch {
    throw new Error(
      'El archivo seleccionado no contiene un JSON válido.'
    );
  }

  if (
    !respaldo ||
    respaldo.formato !== 'IGLESIA_RESPALDO' ||
    respaldo.version !== 1 ||
    !respaldo.tablas ||
    typeof respaldo.tablas !== 'object'
  ) {
    throw new Error(
      'El archivo no corresponde a un respaldo compatible de Iglesia.'
    );
  }

  const nombresTablas = [
    'usuarios',
    'configuracion_parroquial',
    'bautizos',
    'comuniones',
    'confirmaciones',
    'matrimonios'
  ];

  for (const nombre of nombresTablas) {

    if (!Array.isArray(respaldo.tablas[nombre])) {
      throw new Error(
        `El respaldo no contiene correctamente la tabla ${nombre}.`
      );
    }

  }

  // Verificar integridad SHA-256.

  const datosOriginales = {

    formato: respaldo.formato,

    version: respaldo.version,

    generadoEn: respaldo.generadoEn,

    tablas: respaldo.tablas

  };

  const bytes = new TextEncoder().encode(
    JSON.stringify(datosOriginales)
  );

  const digest = await crypto.subtle.digest(
    'SHA-256',
    bytes
  );

  const checksumCalculado = Array
    .from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  if (
    typeof respaldo.checksum !== 'string' ||
    checksumCalculado !== respaldo.checksum.toLowerCase()
  ) {
    throw new Error(
      'El respaldo está dañado o fue modificado. No se importaron datos.'
    );
  }

  // Comprobar que las tablas tengan estructura correcta.

  for (const nombre of nombresTablas) {

    for (const registro of respaldo.tablas[nombre]) {

      if (
        !registro ||
        typeof registro !== 'object' ||
        Array.isArray(registro)
      ) {
        throw new Error(
          `Se encontró un registro inválido en ${nombre}.`
        );
      }

    }

  }

  // No permitir sobrescribir registros existentes.

  const tablasProtegidas = [
    'usuarios',
    'bautizos',
    'comuniones',
    'confirmaciones',
    'matrimonios'
  ];

  for (const nombre of tablasProtegidas) {

    const existentes = await this.consultar(
      `SELECT COUNT(*) AS total FROM ${nombre}`
    );

    if (Number(existentes[0]?.total || 0) > 0) {
      throw new Error(
        `La tabla ${nombre} ya contiene registros. No se realizará la importación para proteger los datos existentes.`
      );
    }

  }

  // La configuración inicial creada por el servicio
  // solo puede reemplazarse si sigue siendo la predeterminada.

  const configuracionActual = await this.consultar(
    'SELECT * FROM configuracion_parroquial'
  );

  if (configuracionActual.length > 1) {
    throw new Error(
      'Existe más de una configuración parroquial. No se importó el respaldo.'
    );
  }

  if (configuracionActual.length === 1) {

    const actual = configuracionActual[0];

    const valoresPermitidos: Record<string, string> = {
      parroco_nombre: '',
      pie_firma: 'Párroco',
      parroco_firma_data: '',
      parroco_firma_tipo: '',
      diocesis_nombre: 'Diócesis de Santa Elena',
      vicaria_nombre: 'Vicaría San José',
      parroquia_nombre: '',
      logo_diocesis_data: '',
      logo_diocesis_tipo: '',
      logo_parroquia_data: '',
      logo_parroquia_tipo: '',
      sello_parroquia_data: '',
      sello_parroquia_tipo: ''
    };

    for (const [campo, valor] of Object.entries(valoresPermitidos)) {

      if (actual[campo] !== valor) {
        throw new Error(
          'La configuración del dispositivo ya fue modificada. No se sobrescribirá.'
        );
      }

    }

  }

  // Iniciar transacción: todos los datos se importan
  // o ninguno se importa.

  await this.conexion.execute('BEGIN TRANSACTION;');

  try {

    const ordenTablas = [
      'usuarios',
      'configuracion_parroquial',
      'bautizos',
      'comuniones',
      'confirmaciones',
      'matrimonios'
    ];

    const cantidades: Record<string, number> = {};

    for (const nombre of ordenTablas) {

      const filas = respaldo.tablas[nombre];

      // Obtener columnas reales de la tabla móvil.

      const estructura = await this.conexion.query(
        `PRAGMA table_info("${nombre}")`
      );

      const columnasDisponibles = new Set(
        (estructura.values || []).map(
          (columna: any) => columna.name
        )
      );

      if (columnasDisponibles.size === 0) {
        throw new Error(
          `No se encontró la estructura de la tabla ${nombre}.`
        );
      }

      // Evitar pérdida silenciosa de información.

      for (const fila of filas) {

        for (const campo of Object.keys(fila)) {

          if (!columnasDisponibles.has(campo)) {
            throw new Error(
              `El campo ${campo} de ${nombre} no existe en la base móvil.`
            );
          }

        }

      }

      if (nombre === 'configuracion_parroquial') {
        await this.conexion.execute(
          'DELETE FROM configuracion_parroquial;'
        );
      }

      for (const fila of filas) {

        const columnas = Object.keys(fila);

        if (columnas.length === 0) {
          throw new Error(
            `Se encontró un registro vacío en ${nombre}.`
          );
        }

        const nombresColumnas = columnas
          .map(campo => `"${campo}"`)
          .join(', ');

        const interrogantes = columnas
          .map(() => '?')
          .join(', ');

        const valores = columnas.map(
          campo => fila[campo] ?? null
        );

        const sql = `
          INSERT INTO "${nombre}" (${nombresColumnas})
          VALUES (${interrogantes})
        `;

        await this.conexion.run(sql, valores);

      }

      cantidades[nombre] = filas.length;

    }

    // Comprobar que las cantidades insertadas coincidan.

    for (const nombre of ordenTablas) {

      const resultado = await this.conexion.query(
        `SELECT COUNT(*) AS total FROM "${nombre}"`
      );

      const total = Number(
        resultado.values?.[0]?.total || 0
      );

      if (total !== cantidades[nombre]) {
        throw new Error(
          `La verificación de registros falló en ${nombre}.`
        );
      }

    }

    await this.conexion.execute('COMMIT;');

    return {

      success: true,

      message:
        'El respaldo se importó correctamente.',

      generadoEn: respaldo.generadoEn,

      cantidades

    };

  } catch (error) {

    try {
      await this.conexion.execute('ROLLBACK;');
    } catch (errorRollback) {
      console.error(
        'Error al revertir importación:',
        errorRollback
      );
    }

    throw error;

  }

}


  // =====================================================
  // CERRAR CONEXIÓN
  // =====================================================

  async cerrar(): Promise<void> {

    if (!this.conexion) {
      return;
    }

    await this.conexion.close();

    await this.sqlite.closeConnection(
      this.nombreBaseDatos,
      false
    );

    this.conexion = undefined;
    this.inicializacion = undefined;
  }
}