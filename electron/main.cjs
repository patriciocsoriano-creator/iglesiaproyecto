
const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog
} = require('electron');

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');



const {
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

  exportarRespaldoCompleto

} = require('./database/database.cjs');


// =====================================================
// EXPORTAR RESPALDO COMPLETO PARA ANDROID E IOS
// =====================================================

ipcMain.handle(
  'respaldo:exportar',
  async (event) => {

    try {

      // Generar respaldo en memoria.
      const respaldo = exportarRespaldoCompleto();

      const contenido = JSON.stringify(
        respaldo,
        null,
        2
      );

      const fecha = new Date()
        .toISOString()
        .replace(/[:.]/g, '-');

      const nombreArchivo =
        `Respaldo_Iglesia_${fecha}.json`;

      // Mostrar diálogo para elegir dónde guardar.
      const resultado = await dialog.showSaveDialog(
        BrowserWindow.fromWebContents(event.sender),
        {
          title: 'Exportar respaldo de la parroquia',
          defaultPath: nombreArchivo,
          buttonLabel: 'Guardar respaldo',
          filters: [
            {
              name: 'Respaldo de Iglesia',
              extensions: ['json']
            }
          ]
        }
      );

      if (
        resultado.canceled ||
        !resultado.filePath
      ) {

        return {
          success: false,
          canceled: true,
          message: 'Exportación cancelada.'
        };

      }

      let destino = resultado.filePath;

      if (!destino.toLowerCase().endsWith('.json')) {
        destino += '.json';
      }

      // Guardar primero en un archivo temporal.
      // Luego renombrarlo para evitar respaldos incompletos.

      const temporal =
        `${destino}.${crypto.randomUUID()}.tmp`;

      try {

        await fs.writeFile(
          temporal,
          contenido,
          {
            encoding: 'utf8',
            flag: 'wx'
          }
        );

        await fs.rename(temporal, destino);

      } catch (error) {

        try {
          await fs.unlink(temporal);
        } catch (_) {}

        throw error;

      }

      const tablas = respaldo.tablas;

      const cantidades = {

        usuarios: tablas.usuarios.length,

        configuracion:
          tablas.configuracion_parroquial.length,

        bautizos: tablas.bautizos.length,

        comuniones: tablas.comuniones.length,

        confirmaciones: tablas.confirmaciones.length,

        matrimonios: tablas.matrimonios.length

      };

      console.log(
        '[RESPALDO] Exportación completa:',
        cantidades
      );

      return {

        success: true,

        canceled: false,

        path: destino,

        cantidades,

        message:
          'Respaldo parroquial exportado correctamente.'

      };

    } catch (error) {

      console.error(
        '[RESPALDO] Error al exportar:',
        error
      );

      return {

        success: false,

        canceled: false,

        message:
          error.message ||
          'No se pudo exportar el respaldo.'

      };

    }

  }
);

// =====================================================
// CONFIGURACIÓN DE DOCUMENTOS TEMPORALES
// =====================================================

const CARPETA_TEMPORAL = path.join(
  app.getPath('temp'),
  'Iglesia-Certificados'
);

// =====================================================
// LIMPIAR PDF TEMPORALES
// =====================================================

async function limpiarPdfTemporales() {
  try {
    await fs.mkdir(CARPETA_TEMPORAL, {
      recursive: true
    });

    const archivos = await fs.readdir(CARPETA_TEMPORAL);
    const ahora = Date.now();
    const LIMITE = 24 * 60 * 60 * 1000;

    for (const archivo of archivos) {

      if (!archivo.toLowerCase().endsWith('.pdf')) {
        continue;
      }

      const ruta = path.join(CARPETA_TEMPORAL, archivo);

      try {
        const info = await fs.stat(ruta);

        if (ahora - info.mtimeMs > LIMITE) {
          await fs.unlink(ruta);
        }

      } catch (error) {
        console.warn(
          '[PDF] No se pudo limpiar:',
          archivo,
          error
        );
      }
    }

  } catch (error) {
    console.error(
      '[PDF] Error limpiando temporales:',
      error
    );
  }
}

// =====================================================
// VALIDACIÓN DE HTML
// =====================================================

function validarHtml(html) {

  if (
    typeof html !== 'string' ||
    html.trim().length === 0 ||
    Buffer.byteLength(html, 'utf8') > 5 * 1024 * 1024
  ) {
    throw new Error(
      'El contenido del certificado no es válido.'
    );
  }
}

// =====================================================
// ESPERAR CARGA DE IMÁGENES Y FUENTES
// =====================================================

async function esperarContenidoDocumento(ventana) {

  await ventana.webContents.executeJavaScript(`
    (async () => {

      // Esperar fuentes
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Esperar imágenes
      const imagenes = Array.from(document.images);

      await Promise.all(
        imagenes.map((imagen) => {

          if (imagen.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {

            imagen.onload = resolve;
            imagen.onerror = resolve;

            // Evitar esperas indefinidas
            setTimeout(resolve, 10000);

          });

        })
      );

      // Dar tiempo al navegador para completar el diseño
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      return true;

    })();
  `);
}

// =====================================================
// CREAR PDF EN MEMORIA
// =====================================================

async function generarPdfEnMemoria(html) {

  validarHtml(html);

  let ventanaPdf;

  try {

    ventanaPdf = new BrowserWindow({
      show: false,
      width: 1000,
      height: 1400,
      autoHideMenuBar: true,

      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    const url =
      'data:text/html;charset=utf-8,' +
      encodeURIComponent(html);

    await ventanaPdf.loadURL(url);

    // Esperar que carguen los logos y la firma
    await esperarContenidoDocumento(ventanaPdf);

    const pdf = await ventanaPdf.webContents.printToPDF({

      pageSize: 'A4',

      printBackground: true,

      preferCSSPageSize: true,

      displayHeaderFooter: false,

      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }

    });

    if (!pdf || pdf.length === 0) {
      throw new Error(
        'Electron generó un documento PDF vacío.'
      );
    }

    return pdf;

  } finally {

    if (
      ventanaPdf &&
      !ventanaPdf.isDestroyed()
    ) {
      ventanaPdf.close();
    }

  }
}

// =====================================================
// GUARDAR CERTIFICADO PDF EN WINDOWS
// =====================================================

ipcMain.handle(
  'documento:guardar-pdf',
  async (event, html) => {

    try {

      validarHtml(html);

      const fecha = new Date()
        .toISOString()
        .slice(0, 10);

      const opciones = {

        title: 'Guardar certificado de bautismo',

        defaultPath:
          `Certificado_Bautismo_${fecha}.pdf`,

        buttonLabel: 'Guardar PDF',

        filters: [
          {
            name: 'Documento PDF',
            extensions: ['pdf']
          }
        ]

      };

      // Asociar el diálogo con la ventana que lo solicitó
      const ventanaPadre =
        BrowserWindow.fromWebContents(event.sender);

      let resultadoDialogo;

      if (
        ventanaPadre &&
        !ventanaPadre.isDestroyed()
      ) {

        resultadoDialogo = await dialog.showSaveDialog(
          ventanaPadre,
          opciones
        );

      } else {

        resultadoDialogo = await dialog.showSaveDialog(
          opciones
        );

      }

      // El usuario canceló
      if (
        resultadoDialogo.canceled ||
        !resultadoDialogo.filePath
      ) {

        return {
          success: false,
          canceled: true,
          message: 'El guardado fue cancelado.'
        };

      }

      // Generar el PDF
      const pdf = await generarPdfEnMemoria(html);

      // Guardar el archivo
      let ruta = resultadoDialogo.filePath;

      if (!ruta.toLowerCase().endsWith('.pdf')) {
        ruta += '.pdf';
      }

      await fs.writeFile(ruta, pdf);

      console.log(
        '[PDF] Certificado guardado correctamente:',
        ruta
      );

      return {

        success: true,
        canceled: false,

        message:
          'El certificado PDF se generó correctamente.',

        path: ruta

      };

    } catch (error) {

      console.error(
        '[PDF] Error al guardar certificado:',
        error
      );

      return {

        success: false,
        canceled: false,

        message:
          error.message ||
          'No se pudo generar el certificado PDF.'

      };

    }

  }
);

// =====================================================
// PREVISUALIZAR E IMPRIMIR SIN GUARDAR PDF
// =====================================================

ipcMain.handle(
  'documento:previsualizar-imprimir',
  async (event, html) => {

    validarHtml(html);

    const ventana = new BrowserWindow({

      width: 1050,
      height: 900,

      minWidth: 800,
      minHeight: 650,

      title: 'Previsualización - Certificado de Bautismo',

      autoHideMenuBar: true,

      backgroundColor: '#e9edf2',

      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }

    });

    ventana.webContents.setWindowOpenHandler(() => ({
      action: 'deny'
    }));

    const url =
      'data:text/html;charset=utf-8,' +
      encodeURIComponent(html);

    try {

      await ventana.loadURL(url);

      await esperarContenidoDocumento(ventana);

      ventana.show();

      return {

        success: true,

        message:
          'Previsualización abierta correctamente.'

      };

    } catch (error) {

      if (!ventana.isDestroyed()) {
        ventana.close();
      }

      console.error(
        '[PDF] Error en previsualización:',
        error
      );

      throw error;

    }

  }
);

// =====================================================
// GENERAR PDF TEMPORAL Y PREPARAR WHATSAPP
// =====================================================

ipcMain.handle(
  'documento:preparar-whatsapp',
  async (event, datos) => {

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {

      throw new Error(
        'No se recibieron los datos del documento.'
      );

    }

    const { html, mensaje } = datos;

    validarHtml(html);

    if (
      typeof mensaje !== 'string' ||
      mensaje.length > 3000
    ) {

      throw new Error(
        'El mensaje de WhatsApp no es válido.'
      );

    }

    let rutaPdf = '';

    try {

      await fs.mkdir(CARPETA_TEMPORAL, {
        recursive: true
      });

      const pdf = await generarPdfEnMemoria(html);

      const nombreArchivo =
        `Certificado_Bautismo_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.pdf`;

      rutaPdf = path.join(
        CARPETA_TEMPORAL,
        nombreArchivo
      );

      await fs.writeFile(rutaPdf, pdf);

      const urlWhatsApp =
        `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

      await shell.openExternal(urlWhatsApp);

      shell.showItemInFolder(rutaPdf);

      return {

        success: true,

        message:
          'PDF preparado. Adjunta el archivo en WhatsApp.'

      };

    } catch (error) {

      console.error(
        '[PDF WHATSAPP] Error:',
        error
      );

      throw new Error(
        'No se pudo preparar el certificado para WhatsApp: ' +
        (error.message || 'Error desconocido.')
      );

    }

  }
);

// =====================================================
// CREAR VENTANA PRINCIPAL
// =====================================================

function createWindow() {

  const win = new BrowserWindow({

    width: 1280,
    height: 800,

    minWidth: 900,
    minHeight: 600,

    title: 'IGLESIA - Administración Parroquial',

    webPreferences: {

      preload: path.join(
        __dirname,
        'preload.cjs'
      ),

      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true

    }

  });

  win.loadFile(
    path.join(__dirname, '../www/index.html')
  );

}

// =====================================================
// AUTENTICACIÓN
// =====================================================

// =====================================================
// AUTENTICACIÓN
// =====================================================

ipcMain.handle(
  'auth:login',
  (event, credentials) => {

    console.log('[LOGIN] Solicitud recibida desde Angular');

    try {

      if (
        !credentials ||
        typeof credentials.usuario !== 'string' ||
        typeof credentials.contrasena !== 'string' ||
        credentials.usuario.length > 100 ||
        credentials.contrasena.length > 200
      ) {

        console.log('[LOGIN] Datos inválidos');

        return {
          success: false,
          message: 'Datos de acceso inválidos.'
        };

      }

      const respuesta = autenticarUsuario(
        credentials.usuario.trim(),
        credentials.contrasena
      );

      console.log(
        '[LOGIN] Resultado:',
        respuesta.success ? 'Autenticación correcta' : 'Credenciales incorrectas'
      );

      return respuesta;

    } catch (error) {

      console.error('[LOGIN] Error:', error);

      return {
        success: false,
        message: 'Error interno al validar las credenciales.'
      };

    }

  }
);

// =====================================================
// OBTENER CONFIGURACIÓN DEL PÁRROCO
// =====================================================

ipcMain.handle(
  'parroco:obtener',
  () => {

    return obtenerParrocoVigente();

  }
);

// =====================================================
// GUARDAR CONFIGURACIÓN DEL PÁRROCO
// =====================================================

ipcMain.handle(
  'parroco:guardar',
  (event, datos) => {

    console.log(
      '[ELECTRON] Se recibió solicitud de guardado'
    );

    try {

      if (
        !datos ||
        typeof datos !== 'object' ||
        Array.isArray(datos) ||
        typeof datos.nombre !== 'string'
      ) {

        throw new Error(
          'Datos de configuración parroquial inválidos.'
        );

      }

      const identidad = datos.identidad || {};

      const resultado = guardarParrocoVigente(

        datos.nombre,

        datos.pieFirma || 'Párroco',

        datos.firmaData || '',

        datos.firmaTipo || '',

        {

          diocesisNombre:
            identidad.diocesis_nombre || '',

          vicariaNombre:
            identidad.vicaria_nombre || '',

          parroquiaNombre:
            identidad.parroquia_nombre || '',

          logoDiocesisData:
            identidad.logo_diocesis_data || '',

          logoDiocesisTipo:
            identidad.logo_diocesis_tipo || '',

          logoParroquiaData:
            identidad.logo_parroquia_data || '',

          logoParroquiaTipo:
            identidad.logo_parroquia_tipo || '',

          selloParroquiaData:
  identidad.sello_parroquia_data || '',

selloParroquiaTipo:
  identidad.sello_parroquia_tipo || ''

        }

      );

      console.log(
        '[ELECTRON] Guardado terminado correctamente'
      );

      return resultado;

    } catch (error) {

      console.error(
        '[ELECTRON] Error en guardado:',
        error
      );

      throw error;

    }

  }
);

// =====================================================
// GUARDAR BAUTIZO
// =====================================================

ipcMain.handle(
  'bautizos:guardar',
  (event, datos) => {

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {

      throw new Error(
        'Datos del bautizo inválidos.'
      );

    }

    return guardarBautizo(datos);

  }
);

// =====================================================
// LISTAR BAUTIZOS
// =====================================================

ipcMain.handle(
  'bautizos:listar',
  (event, busqueda) => {

    if (
      typeof busqueda !== 'string' ||
      busqueda.length > 200
    ) {

      busqueda = '';

    }

    return listarBautizos(busqueda);

  }
);

ipcMain.handle('bautizos:actualizar', async (_event, datos) => {
  try {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new Error('Los datos del bautizo son inválidos.');
    }

    return actualizarBautizo(datos);

  } catch (error) {
    console.error('Error al actualizar bautizo:', error);
    throw error;
  }
});

// =====================================================
// OBTENER BAUTIZO POR IDENTIFICADOR
// =====================================================

ipcMain.handle(
  'bautizos:obtener',
  (event, id) => {

    if (
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {

      return null;

    }

    return obtenerBautizo(id);

  }
);

// =====================================================
// BUSCAR BAUTISMO POR CÉDULA PARA PRIMERA COMUNIÓN
// =====================================================

ipcMain.handle(
  'bautizos:buscar-por-cedula',
  (event, cedula) => {

    if (
      typeof cedula !== 'string' ||
      cedula.trim().length > 20 ||
      !cedula.trim()
    ) {
      throw new Error('La cédula ingresada no es válida.');
    }

    return buscarBautismoPorCedula(cedula.trim());

  }
);

// =====================================================
// GUARDAR PRIMERA COMUNIÓN
// =====================================================

ipcMain.handle(
  'comuniones:guardar',
  (event, datos) => {

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {
      throw new Error(
        'Los datos de la Primera Comunión son inválidos.'
      );
    }

    return guardarComunion(datos);

  }
);



 // =====================================================
 // LISTAR PRIMERAS COMUNIONES
 // =====================================================

ipcMain.handle(
  'comuniones:listar',
  (event, busqueda) => {

    if (
      typeof busqueda !== 'string' ||
      busqueda.length > 200
    ) {
      busqueda = '';
    }

    return listarComuniones(busqueda);

  }
);

// =====================================================
// OBTENER PRIMERA COMUNIÓN POR IDENTIFICADOR
// =====================================================

ipcMain.handle(
  'comuniones:obtener',
  (event, id) => {

    if (
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return null;
    }

    return obtenerComunion(id);

  }
);


 // =====================================================
 // BUSCAR ANTECEDENTES PARA CONFIRMACIÓN
 // =====================================================

ipcMain.handle(
  'confirmaciones:buscar-antecedentes',
  (event, cedula) => {

    if (
      typeof cedula !== 'string' ||
      !cedula.trim() ||
      cedula.trim().length > 20
    ) {
      throw new Error(
        'La cédula ingresada no es válida.'
      );
    }

    return buscarAntecedentesConfirmacion(
      cedula.trim()
    );

  }
);


// =====================================================
// GUARDAR CONFIRMACIÓN
// =====================================================

ipcMain.handle(
  'confirmaciones:guardar',
  (event, datos) => {

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {
      throw new Error(
        'Los datos de la Confirmación son inválidos.'
      );
    }

    return guardarConfirmacion(datos);

  }
);


// =====================================================
// LISTAR CONFIRMACIONES
// =====================================================

ipcMain.handle(
  'confirmaciones:listar',
  (event, busqueda) => {

    if (
      typeof busqueda !== 'string' ||
      busqueda.length > 200
    ) {
      busqueda = '';
    }

    return listarConfirmaciones(busqueda);

  }
);


// =====================================================
// OBTENER CONFIRMACIÓN POR IDENTIFICADOR
// =====================================================

ipcMain.handle(
  'confirmaciones:obtener',
  (event, id) => {

    if (
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return null;
    }

    return obtenerConfirmacion(id);

  }
);

ipcMain.handle('confirmaciones:actualizar', async (_event, datos) => {
  try {
    return actualizarConfirmacion(datos);
  } catch (error) {
    console.error('Error al actualizar confirmación:', error);

    return {
      success: false,
      message: error.message || 'Error al actualizar la confirmación.'
    };
  }
});


// =====================================================
// GUARDAR MATRIMONIO
// =====================================================

ipcMain.handle(
  'matrimonios:guardar',
  (event, datos) => {

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {
      throw new Error(
        'Los datos del matrimonio son inválidos.'
      );
    }

    return guardarMatrimonio(datos);
  }
);

// =====================================================
// LISTAR MATRIMONIOS
// =====================================================

ipcMain.handle(
  'matrimonios:listar',
  (event, busqueda) => {

    if (
      typeof busqueda !== 'string' ||
      busqueda.length > 200
    ) {
      busqueda = '';
    }

    return listarMatrimonios(busqueda);
  }
);

// =====================================================
// OBTENER MATRIMONIO POR ID
// =====================================================

ipcMain.handle(
  'matrimonios:obtener',
  (event, id) => {

    if (
      !Number.isSafeInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return null;
    }

    return obtenerMatrimonio(id);
  }
);


// =====================================================
// ACTUALIZAR MATRIMONIO
// =====================================================

ipcMain.handle('matrimonios:actualizar', async (event, datos) => {

  if (
    !datos ||
    typeof datos !== 'object' ||
    Array.isArray(datos)
  ) {
    throw new Error('Los datos del matrimonio son inválidos.');
  }

  return actualizarMatrimonio(datos);

});


// =====================================================
// INICIAR APLICACIÓN
// =====================================================

app.whenReady().then(async () => {

  try {

    initializeDatabase();

    await limpiarPdfTemporales();

    createWindow();

    app.on('activate', () => {

      if (
        BrowserWindow.getAllWindows().length === 0
      ) {

        createWindow();

      }

    });

  } catch (error) {

    console.error(
      '[ELECTRON] Error al iniciar la aplicación:',
      error
    );

    app.quit();

  }

});

// =====================================================
// CERRAR APLICACIÓN
// =====================================================

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }

});