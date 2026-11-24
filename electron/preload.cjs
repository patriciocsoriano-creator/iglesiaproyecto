
const {
  contextBridge,
  ipcRenderer
} = require('electron');

// =====================================================
// API SEGURA PARA ANGULAR
// =====================================================

contextBridge.exposeInMainWorld('iglesia', {

  // ---------------------------------------------------
  // AUTENTICACIÓN
  // ---------------------------------------------------

  auth: {
    login: (credentials) =>
      ipcRenderer.invoke('auth:login', credentials)
  },

  // ---------------------------------------------------
  // CONFIGURACIÓN DEL PÁRROCO
  // ---------------------------------------------------

  parroco: {

    obtener: () =>
      ipcRenderer.invoke('parroco:obtener'),

    guardar: (datos) =>
      ipcRenderer.invoke('parroco:guardar', datos)

  },

    // ---------------------------------------------------
  // RESPALDOS Y TRANSFERENCIA DE DATOS
  // ---------------------------------------------------

  respaldo: {

    exportar: () =>
      ipcRenderer.invoke('respaldo:exportar')

  },

  // ---------------------------------------------------
  // REGISTRO DE BAUTIZOS
  // ---------------------------------------------------

  bautizos: {

    guardar: (datos) =>
      ipcRenderer.invoke('bautizos:guardar', datos),

    listar: (busqueda = '') =>
      ipcRenderer.invoke('bautizos:listar', busqueda),

    obtener: (id) =>
      ipcRenderer.invoke('bautizos:obtener', id),

    actualizar: datos =>
  ipcRenderer.invoke('bautizos:actualizar', datos),

    buscarPorCedula: (cedula) =>
      ipcRenderer.invoke(
        'bautizos:buscar-por-cedula',
        cedula
      )

  },

  // ---------------------------------------------------
  // REGISTRO DE PRIMERAS COMUNIONES
  // ---------------------------------------------------

  comuniones: {

    guardar: (datos) =>
      ipcRenderer.invoke(
        'comuniones:guardar',
        datos
      ),

    listar: (busqueda = '') =>
      ipcRenderer.invoke(
        'comuniones:listar',
        busqueda
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        'comuniones:obtener',
        id
      )

  },

  // ---------------------------------------------------
  // REGISTRO DE CONFIRMACIONES
  // ---------------------------------------------------

  confirmaciones: {

    buscarAntecedentes: (cedula) =>
      ipcRenderer.invoke(
        'confirmaciones:buscar-antecedentes',
        cedula
      ),

    guardar: (datos) =>
      ipcRenderer.invoke(
        'confirmaciones:guardar',
        datos
      ),

    listar: (busqueda = '') =>
      ipcRenderer.invoke(
        'confirmaciones:listar',
        busqueda
      ),

    obtener: (id) =>
      ipcRenderer.invoke(
        'confirmaciones:obtener',
        id
      ),
      actualizar: (datos) =>
    ipcRenderer.invoke('confirmaciones:actualizar', datos)

  },


  // ---------------------------------------------------
  // REGISTRO DE MATRIMONIOS
  // ---------------------------------------------------

  // ---------------------------------------------------
// REGISTRO DE MATRIMONIOS
// ---------------------------------------------------

matrimonios: {

  guardar: (datos) =>
    ipcRenderer.invoke(
      'matrimonios:guardar',
      datos
    ),

  listar: (busqueda = '') =>
    ipcRenderer.invoke(
      'matrimonios:listar',
      busqueda
    ),

  obtener: (id) =>
    ipcRenderer.invoke(
      'matrimonios:obtener',
      id
    ),

  actualizar: (datos) =>
    ipcRenderer.invoke(
      'matrimonios:actualizar',
      datos
    )

},


  // ---------------------------------------------------
  // DOCUMENTOS Y CERTIFICADOS
  // ---------------------------------------------------

  documentos: {

    guardarPdf: (html) =>
      ipcRenderer.invoke(
        'documento:guardar-pdf',
        html
      ),

    previsualizarImprimir: (html) =>
      ipcRenderer.invoke(
        'documento:previsualizar-imprimir',
        html
      ),

    prepararWhatsApp: (html, mensaje) =>
      ipcRenderer.invoke(
        'documento:preparar-whatsapp',
        {
          html,
          mensaje
        }
      )

  }

});