
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-confirmacion',
  templateUrl: './listado-confirmacion.page.html',
  styleUrls: ['./listado-confirmacion.page.scss'],
  standalone: false
})
export class ListadoConfirmacionPage implements OnInit {

  confirmaciones: any[] = [];
  confirmacionSeleccionada: any = null;

  parroco: any = null;

  busqueda = '';

  cargando = false;
  cargandoDetalle = false;
  guardando = false;
  editando = false;

  errorCarga = '';

  formulario: any = {};

  constructor(
    private alertController: AlertController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarConfirmaciones();
    this.cargarConfiguracionParroquial();
  }

  // ==========================================
  // CONFIGURACIÓN PARROQUIAL
  // ==========================================

  async cargarConfiguracionParroquial(): Promise<void> {
    try {
      this.parroco = await window.iglesia.parroco.obtener();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar configuración parroquial:', error);
    }
  }

  // ==========================================
  // LISTAR CONFIRMACIONES
  // ==========================================

  async cargarConfirmaciones(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';

    try {
      const resultado = await window.iglesia.confirmaciones.listar(
        this.busqueda.trim()
      );

      this.confirmaciones = Array.isArray(resultado) ? resultado : [];

      if (
        this.confirmacionSeleccionada &&
        !this.confirmaciones.some(
          item => Number(item.id) === Number(this.confirmacionSeleccionada.id)
        )
      ) {
        this.confirmacionSeleccionada = null;
        this.formulario = {};
        this.editando = false;
      }

    } catch (error) {
      console.error('Error al listar confirmaciones:', error);
      this.errorCarga = 'No fue posible cargar las confirmaciones.';
      this.confirmaciones = [];
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // CONSULTAR UNA CONFIRMACIÓN
  // ==========================================

  async consultarConfirmacion(confirmacion: any): Promise<void> {
    if (!confirmacion?.id) {
      return;
    }

    this.cargandoDetalle = true;
    this.editando = false;
    this.confirmacionSeleccionada = null;
    this.formulario = {};

    try {
      const resultado = await window.iglesia.confirmaciones.obtener(
        Number(confirmacion.id)
      );

      if (!resultado) {
        await this.mostrarAlerta(
          'Registro no encontrado',
          'No se encontró la confirmación seleccionada.'
        );
        return;
      }

      this.confirmacionSeleccionada = resultado;
      this.formulario = this.copiarDatosEditables(resultado);

    } catch (error) {
      console.error('Error al consultar confirmación:', error);

      await this.mostrarAlerta(
        'Error',
        'No fue posible consultar la información de la confirmación.'
      );

    } finally {
      this.cargandoDetalle = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // COPIAR LOS DATOS EDITABLES
  // ==========================================

  copiarDatosEditables(datos: any): any {
    return {
      id: datos.id,

      numero_confirmacion: datos.numero_confirmacion ?? '',
      fecha_confirmacion: this.formatearFechaInput(
        datos.fecha_confirmacion
      ),
      tomo_confirmacion: datos.tomo_confirmacion ?? '',
      pagina_confirmacion: datos.pagina_confirmacion ?? '',
      lugar_confirmacion: datos.lugar_confirmacion ?? '',
      ministro: datos.ministro ?? '',

      cedula: datos.cedula ?? '',
      nombres: datos.nombres ?? '',
      apellidos: datos.apellidos ?? '',
      lugar_nacimiento: datos.lugar_nacimiento ?? '',
      fecha_nacimiento: this.formatearFechaInput(
        datos.fecha_nacimiento
      ),

      parroquia_bautismo: datos.parroquia_bautismo ?? '',
      fecha_bautismo: this.formatearFechaInput(
        datos.fecha_bautismo
      ),

      nombre_padre: datos.nombre_padre ?? '',
      nombre_madre: datos.nombre_madre ?? '',
      nombre_padrino: datos.nombre_padrino ?? '',
      nombre_madrina: datos.nombre_madrina ?? ''
    };
  }

  // ==========================================
  // ACTIVAR EDICIÓN
  // ==========================================

  activarEdicion(): void {
    if (!this.confirmacionSeleccionada) {
      return;
    }

    this.formulario = this.copiarDatosEditables(
      this.confirmacionSeleccionada
    );

    this.editando = true;
  }

  // ==========================================
  // CANCELAR EDICIÓN
  // ==========================================

  async cancelarEdicion(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Cancelar edición',
      message: '¿Deseas descartar los cambios realizados?',
      buttons: [
        {
          text: 'Continuar editando',
          role: 'cancel'
        },
        {
          text: 'Descartar cambios',
          role: 'destructive',
          handler: () => {
            this.formulario = this.copiarDatosEditables(
              this.confirmacionSeleccionada
            );

            this.editando = false;
          }
        }
      ]
    });

    await alerta.present();
  }

  // ==========================================
  // GUARDAR CAMBIOS EN SQLITE
  // ==========================================

  async guardarCambios(): Promise<void> {
    if (!this.confirmacionSeleccionada?.id) {
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    const alerta = await this.alertController.create({
      header: 'Confirmar actualización',
      message: '¿Deseas guardar los cambios de esta confirmación?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async () => {
            await this.actualizarConfirmacion();
          }
        }
      ]
    });

    await alerta.present();
  }

  private async actualizarConfirmacion(): Promise<void> {
    this.guardando = true;

    try {
      const datos = {
        id: Number(this.confirmacionSeleccionada.id),

        numero_confirmacion: this.formulario.numero_confirmacion,
        fecha_confirmacion: this.formulario.fecha_confirmacion,
        tomo_confirmacion: this.formulario.tomo_confirmacion,
        pagina_confirmacion: this.formulario.pagina_confirmacion,
        lugar_confirmacion: this.formulario.lugar_confirmacion,
        ministro: this.formulario.ministro,

        cedula: this.formulario.cedula,
        nombres: this.formulario.nombres,
        apellidos: this.formulario.apellidos,
        lugar_nacimiento: this.formulario.lugar_nacimiento,
        fecha_nacimiento: this.formulario.fecha_nacimiento,

        parroquia_bautismo: this.formulario.parroquia_bautismo,
        fecha_bautismo: this.formulario.fecha_bautismo,

        nombre_padre: this.formulario.nombre_padre,
        nombre_madre: this.formulario.nombre_madre,
        nombre_padrino: this.formulario.nombre_padrino,
        nombre_madrina: this.formulario.nombre_madrina
      };

      const resultado = await window.iglesia.confirmaciones.actualizar(datos);

      if (!resultado || resultado.success === false) {
        throw new Error(
          resultado?.message || 'No se pudo actualizar la confirmación.'
        );
      }

      this.editando = false;

      await this.cargarConfirmaciones();

      await this.consultarConfirmacion({
        id: datos.id
      });

      await this.mostrarAlerta(
        'Actualización exitosa',
        'La información de la confirmación se guardó correctamente en SQLite.'
      );

    } catch (error: any) {
      console.error('Error al actualizar confirmación:', error);

      await this.mostrarAlerta(
        'No se pudo guardar',
        error?.message || 'Ocurrió un error al actualizar la confirmación.'
      );

    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // VALIDAR FORMULARIO
  // ==========================================

  private validarFormulario(): boolean {
    const campos = [
      {
        valor: this.formulario.numero_confirmacion,
        nombre: 'Número de confirmación'
      },
      {
        valor: this.formulario.fecha_confirmacion,
        nombre: 'Fecha de confirmación'
      },
      {
        valor: this.formulario.nombres,
        nombre: 'Nombres'
      },
      {
        valor: this.formulario.apellidos,
        nombre: 'Apellidos'
      }
    ];

    const faltante = campos.find(
      campo => !String(campo.valor ?? '').trim()
    );

    if (faltante) {
      this.mostrarAlerta(
        'Información incompleta',
        `El campo ${faltante.nombre} es obligatorio.`
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // FORMATEAR FECHAS
  // ==========================================

  formatearFechaInput(fecha: any): string {
    if (!fecha) {
      return '';
    }

    const valor = String(fecha).substring(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return valor;
    }

    const partes = valor.split('/');

    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }

    return '';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) {
      return 'No registrado';
    }

    const valor = this.formatearFechaInput(fecha);

    if (!valor) {
      return String(fecha);
    }

    const [anio, mes, dia] = valor.split('-');

    return `${dia}/${mes}/${anio}`;
  }

  // ==========================================
  // LIMPIAR SELECCIÓN
  // ==========================================

  limpiarSeleccion(): void {
    this.confirmacionSeleccionada = null;
    this.formulario = {};
    this.editando = false;
  }

  // ==========================================
  // ALERTAS
  // ==========================================

  async mostrarAlerta(
    encabezado: string,
    mensaje: string
  ): Promise<void> {
    const alerta = await this.alertController.create({
      header: encabezado,
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alerta.present();
  }

  // =====================================================
// FECHA ACTUAL LOCAL
// =====================================================

obtenerFechaActual(): string {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

// =====================================================
// ESCAPAR TEXTO PARA HTML
// =====================================================

escaparHtml(valor: any): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// =====================================================
// FECHA EN TEXTO
// =====================================================

fechaEnTexto(fecha: string | null | undefined): string {
  if (!fecha) {
    return '________________________';
  }

  const partes = String(fecha).substring(0, 10).split('-');

  if (partes.length !== 3) {
    return String(fecha);
  }

  const anio = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  const meses = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre'
  ];

  if (
    !anio ||
    !dia ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return String(fecha);
  }

  return `${dia} de ${meses[mes - 1]} de ${anio}`;
}

// =====================================================
// CONSTRUIR IMAGEN BASE64
// =====================================================

obtenerImagen(
  data: string | null | undefined,
  tipo: string | null | undefined
): string {
  if (!data) {
    return '';
  }

  const contenido = String(data);

  if (contenido.startsWith('data:')) {
    return contenido;
  }

  if (!tipo) {
    return '';
  }

  return `data:${tipo};base64,${contenido}`;
}

  
// =====================================================
// CONSTRUIR CERTIFICADO DE CONFIRMACIÓN
// =====================================================


construirCertificado(confirmacion: any): string {
  if (!confirmacion) {
    throw new Error('No existe un registro para generar el certificado.');
  }

  const configuracion = this.parroco || {};

  const escapar = (valor: any, defecto = 'No registrada'): string =>
    this.escaparHtml(valor || defecto);

  const nombreCompleto = escapar(
    `${confirmacion.nombres || ''} ${confirmacion.apellidos || ''}`.trim(),
    ''
  ).toUpperCase();

  // Evita repetir "Parroquia" cuando ya viene incluido en la configuración.
  let parroquia = String(
    configuracion.parroquia_nombre || 'San Rafael Arcángel de Muey'
  ).trim();

  parroquia = parroquia.replace(/^parroquia\s+/i, '');

  const diocesis = escapar(
    configuracion.diocesis_nombre,
    'Diócesis de Santa Elena'
  );

  const vicaria = escapar(
    configuracion.vicaria_nombre,
    'Vicaría San José'
  );

  const parroquiaTexto = escapar(parroquia);

  // Fechas.
  const fechaActual = this.fechaEnTexto(this.obtenerFechaActual());
  const fechaNacimiento = this.fechaEnTexto(confirmacion.fecha_nacimiento);
  const fechaBautismo = this.fechaEnTexto(confirmacion.fecha_bautismo);
  const fechaConfirmacion = this.fechaEnTexto(
    confirmacion.fecha_confirmacion
  );

  const anioRegistro = confirmacion.fecha_confirmacion
    ? String(confirmacion.fecha_confirmacion).substring(0, 4)
    : '—';

  // Imágenes de la configuración parroquial.
  const logoDiocesis = this.obtenerImagen(
    configuracion.logo_diocesis_data,
    configuracion.logo_diocesis_tipo
  );

  const logoParroquia = this.obtenerImagen(
    configuracion.logo_parroquia_data,
    configuracion.logo_parroquia_tipo
  );

  const sello = this.obtenerImagen(
    configuracion.sello_parroquia_data,
    configuracion.sello_parroquia_tipo
  );

  // Firma histórica del registro.
  const firma = this.obtenerImagen(
    confirmacion.parroco_firma_data,
    confirmacion.parroco_firma_tipo
  );

  const nombreParroco = escapar(
    confirmacion.parroco_nombre ||
    configuracion.parroco_nombre,
    'Párroco'
  );

  const pieFirma = escapar(confirmacion.pie_firma, 'Párroco');

  const imagenD = logoDiocesis
    ? `<img src="${logoDiocesis}" class="logo logo-diocesis" alt="Diócesis">`
    : '';

  const imagenP = logoParroquia
    ? `<img src="${logoParroquia}" class="logo logo-parroquia" alt="Parroquia">`
    : '';

  const imagenFirma = firma
    ? `<img src="${firma}" class="firma-imagen" alt="Firma del párroco">`
    : '';

  const imagenSello = sello
    ? `<img src="${sello}" class="sello" alt="Sello parroquial">`
    : '';

  // Datos del registro.
  const numero = escapar(confirmacion.numero_confirmacion, '—');
  const tomo = escapar(confirmacion.tomo_confirmacion, '—');
  const pagina = escapar(confirmacion.pagina_confirmacion, '—');

  // Datos personales.
  const cedula = escapar(confirmacion.cedula, 'No registrada');
  const nacimiento = escapar(fechaNacimiento, 'No registrada');
  const lugarNacimiento = escapar(confirmacion.lugar_nacimiento);
  const padre = escapar(confirmacion.nombre_padre);
  const madre = escapar(confirmacion.nombre_madre);

  // Bautismo.
  const parroquiaBautismo = escapar(confirmacion.parroquia_bautismo);
  const fechaBautismoTexto = escapar(fechaBautismo, 'No registrada');

  // Padrinos.
  const padrino = escapar(confirmacion.nombre_padrino);
  const madrina = escapar(confirmacion.nombre_madrina);

  // Sacramento.
  const lugarConfirmacion = escapar(confirmacion.lugar_confirmacion);
  const ministro = escapar(confirmacion.ministro);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Certificado de Confirmación</title>

<style>
@page {
  size: A4 portrait;
  margin: 0;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 210mm;
  height: 297mm;
  font-family: Georgia, 'Times New Roman', serif;
  color: #24364b;
  background: #ffffff;
}

.documento {
  position: relative;
  width: 210mm;
  height: 297mm;
  padding: 9mm 12.5mm 18mm;
  overflow: hidden;
  background: #ffffff;
}

/* ================================
   ENCABEZADO
================================ */

.encabezado {
  height: 30mm;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-bottom: none;
}

.logo {
  position: absolute;
  top: 1mm;
  width: 23mm;
  height: 25mm;
  object-fit: contain;
}

.logo-diocesis {
  left: 1mm;
}

.logo-parroquia {
  right: 1mm;
}

.encabezado-centro {
  width: 100%;
  padding: 0 27mm;
}

.nombre-diocesis {
  color: #193653;
  font-size: 12pt;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 2mm;
}

.nombre-vicaria {
  font-size: 9.5pt;
  font-style: italic;
  margin-bottom: 1.5mm;
  color: #756b58;
}

.nombre-parroquia {
  font-size: 11pt;
  font-weight: bold;
  color: #193653;
  margin-bottom: 1mm;
}

.sector {
  font-size: 9pt;
  font-style: italic;
}

/* ================================
   TÍTULO
================================ */

.titulo-contenedor {
  height: 40mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  border-top: 1px solid #b69a5a;
  margin-top: 3mm;
  padding-top: 2mm;
}

.documento-sacramental {
  font-size: 8pt;
  font-weight: bold;
  letter-spacing: 3px;
  color: #9b824a;
  margin-bottom: 2mm;
  line-height: 1.2;
}

.titulo {
  color: #193653;
  text-align: center;
  font-size: 21pt;
  font-weight: bold;
  line-height: 1.05;
  letter-spacing: .7px;
  margin: 0;
  text-transform: uppercase;
}

.decoracion-titulo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4mm;
  width: 55mm;
  margin-top: 2mm;
  flex-shrink: 0;
}

.decoracion-titulo span {
  height: 1px;
  flex: 1;
  background: #b69a5a;
}

.decoracion-titulo strong {
  color: #b69a5a;
  font-size: 13pt;
}

.fecha-documento {
  position: static;
  display: block;
  width: 100%;
  text-align: right;
  font-size: 9pt;
  color: #596575;
  margin-top: 2mm;
  padding-right: 1mm;
  line-height: 1.3;
  flex-shrink: 0;
}

/* ================================
   CONTENIDO EN DOS COLUMNAS
================================ */

.contenido {
  display: grid;
  grid-template-columns: 30% 70%;
  height: 181mm;
  min-height: 0;
}

.columna-izquierda {
  padding: 0 5mm 0 0;
  border-right: 1px solid #b69a5a;
  overflow: hidden;
}

.columna-derecha {
  position: relative;
  padding: 0 0 0 5mm;
  overflow: hidden;
  width: 100%;
  min-width: 0;
}

/* ================================
   SECCIONES DE LA IZQUIERDA
================================ */

.bloque-datos {
  margin-bottom: 7mm;
}

.titulo-bloque {
  background: #193653;
  color: #ffffff;
  font-family: Arial, sans-serif;
  font-size: 8pt;
  font-weight: bold;
  letter-spacing: .6px;
  text-transform: uppercase;
  padding: 2.5mm 3mm;
  border-left: 1.5mm solid #c5a34f;
  border-radius: 2mm;
  margin-bottom: 3mm;
}

.lista-datos {
  font-size: 8.8pt;
  line-height: 1.5;
  padding-left: 1mm;
  overflow-wrap: anywhere;
}

.fila-dato {
  display: grid;
  grid-template-columns: 27mm 1fr;
  gap: 1mm;
  margin-bottom: 1.5mm;
}

.fila-dato strong {
  color: #263c55;
}

.dato-simple {
  margin-bottom: 2mm;
  overflow-wrap: anywhere;
}

.dato-simple strong {
  display: block;
  margin-bottom: .5mm;
}

/* ================================
   TEXTO DEL CERTIFICADO
================================ */

.texto-certificado {
  width: 100%;
  font-size: 10.5pt;
  line-height: 1.65;
  text-align: justify;
  color: #263445;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.texto-certificado p {
  margin: 0 0 5mm;
  text-align: justify;
}

.texto-certificado .nombre-confirmado {
  text-align: center;
  color: #193653;
  font-size: 14pt;
  font-weight: bold;
  margin: 6mm 0;
  letter-spacing: .4px;
}

.texto-certificado strong {
  font-weight: bold;
}

.datos-registro-final {
  margin-top: 5mm;
  font-weight: bold;
  color: #193653;
  font-size: 10pt;
  line-height: 1.8;
}

/* ================================
   FIRMA
================================ */

.firma-contenedor {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 19mm;
  width: 65mm;
  height: 23mm;
  text-align: center;
  z-index: 2;
}

.firma-imagen {
  display: block;
  width: 42mm;
  height: 13mm;
  object-fit: contain;
  margin: 0 auto -1mm;
}

.linea-firma {
  width: 60mm;
  border-top: 1px solid #193653;
  margin: 0 auto 1mm;
}

.nombre-firmante {
  font-size: 9.5pt;
  font-weight: bold;
  color: #193653;
}

.cargo-firmante {
  font-size: 8.5pt;
  font-style: italic;
  color: #756b58;
  margin-top: .5mm;
}

.sello {
  position: static !important;
  display: block;
  width: 25mm;
  height: 25mm;
  max-width: 100%;
  object-fit: contain;
  object-position: center;
  margin: 0;
  opacity: 1;
  transform: none;
}

.sello-contenedor {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 30mm;
  margin-top: 4mm;
  padding: 0;
  overflow: visible;
}

/* ================================
   PIE DE PÁGINA
================================ */

.pie {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 17mm;
  background: #193653;
  border-top: 2mm solid #b69a5a;
  color: #ffffff;
  text-align: center;
  padding: 2mm 8mm 1mm;
  font-family: Arial, sans-serif;
}

.pie-titulo {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 8.5pt;
  font-weight: bold;
  letter-spacing: .8px;
  color: #d7bd79;
  margin-bottom: 1mm;
}

.pie-datos {
  font-size: 6.8pt;
  line-height: 1.5;
  color: #ffffff;
}

.pie-ubicacion {
  font-size: 7pt;
  letter-spacing: 2px;
  color: #d7bd79;
  margin-top: .5mm;
  font-weight: bold;
}

/* ================================
   IMPRESIÓN A4
================================ */

@media print {
  html,
  body {
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .documento {
    width: 210mm;
    height: 297mm;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
}
</style>
</head>

<body>

<div class="documento">

  <!-- ENCABEZADO -->
  <header class="encabezado">

    ${imagenD}
    ${imagenP}

    <div class="encabezado-centro">

      <div class="nombre-diocesis">
        ${diocesis}
      </div>

      <div class="nombre-vicaria">
        ${vicaria}
      </div>

      <div class="nombre-parroquia">
        Parroquia ${parroquiaTexto}
      </div>

      <div class="sector">
        José Luis Tamayo (Muey)
      </div>

    </div>

  </header>

  <!-- TÍTULO -->
  <section class="titulo-contenedor">

    <div class="documento-sacramental">
      DOCUMENTO SACRAMENTAL
    </div>

    <h1 class="titulo">
      CERTIFICADO DE<br>CONFIRMACIÓN
    </h1>

    <div class="decoracion-titulo">
      <span></span>
      <strong>✦</strong>
      <span></span>
    </div>

    <div class="fecha-documento">
      José Luis Tamayo, ${this.escaparHtml(fechaActual)}
    </div>

  </section>

  <!-- CUERPO EN DOS COLUMNAS -->
  <main class="contenido">

    <!-- COLUMNA IZQUIERDA -->
    <aside class="columna-izquierda">

      <section class="bloque-datos">

        <div class="titulo-bloque">
          Registro parroquial
        </div>

        <div class="lista-datos">

          <div class="fila-dato">
            <strong>N.º:</strong>
            <span>${numero}</span>
          </div>

          <div class="fila-dato">
            <strong>Año:</strong>
            <span>${this.escaparHtml(anioRegistro)}</span>
          </div>

          <div class="fila-dato">
            <strong>Tomo:</strong>
            <span>${tomo}</span>
          </div>

          <div class="fila-dato">
            <strong>Página:</strong>
            <span>${pagina}</span>
          </div>

        </div>

      </section>

      <section class="bloque-datos">

        <div class="titulo-bloque">
          Datos personales
        </div>

        <div class="lista-datos">

          <div class="dato-simple">
            <strong>Nacimiento:</strong>
            ${nacimiento}
          </div>

          <div class="dato-simple">
            <strong>Lugar:</strong>
            ${lugarNacimiento}
          </div>

          <div class="dato-simple">
            <strong>Cédula:</strong>
            ${cedula}
          </div>

          <div class="dato-simple">
            <strong>Padre:</strong>
            ${padre}
          </div>

          <div class="dato-simple">
            <strong>Madre:</strong>
            ${madre}
          </div>

        </div>

      </section>


    </aside>

    <!-- COLUMNA DERECHA -->
    <section class="columna-derecha">

      <div class="texto-certificado">

        <p>
          El infrascrito,
          <strong>${nombreParroco}</strong>,
          Párroco de la Iglesia
          "<strong>${parroquiaTexto}</strong>",
          CERTIFICA que en los archivos de esta parroquia
          consta el registro del sacramento de la Confirmación
          que corresponde a:
        </p>

        <p class="nombre-confirmado">
          ${nombreCompleto}
        </p>

        <p>
          Hijo(a) de <strong>${padre}</strong> y
          <strong>${madre}</strong>, nacido(a) en
          <strong>${lugarNacimiento}</strong>,
          el día <strong>${fechaNacimiento}</strong>.
        </p>

        <p>
          Recibió el sacramento del Bautismo en
          <strong>${parroquiaBautismo}</strong>,
          el día <strong>${fechaBautismoTexto}</strong>.
        </p>

        <p>
          Recibió el sacramento de la Confirmación en
          <strong>${lugarConfirmacion}</strong>,
          el día <strong>${fechaConfirmacion}</strong>,
          siendo ministro de este sacramento
          <strong>${ministro}</strong>.
        </p>

        <p>
          Fueron sus padrinos de Confirmación:
        </p>

        <p style="padding-left: 4mm;">
          <strong>${padrino}</strong><br>
          <strong>${madrina}</strong>
        </p>

        <p>
          Es fiel copia del original que reposa en nuestros archivos.
        </p>

        <div class="datos-registro-final">
          Tomo: ${tomo}
          &nbsp;&nbsp; Página: ${pagina}
          &nbsp;&nbsp; N.º: ${numero}
        </div>

        <div class="sello-contenedor">
  ${imagenSello}
</div>

      </div>

      
    </section>

  </main>

  <!-- FIRMA Y SELLO -->
  <section class="firma-contenedor">

    ${imagenFirma}

    <div class="linea-firma"></div>

    <div class="nombre-firmante">
      ${nombreParroco}
    </div>

    <div class="cargo-firmante">
      ${pieFirma}
    </div>

   

  </section>

  <!-- PIE DE PÁGINA -->
  <footer class="pie">

    <div class="pie-titulo">
      PARROQUIA SAN RAFAEL ARCÁNGEL
    </div>

    <div class="pie-datos">
      Barrio Centenario, Calle 13
    </div>

    <div class="pie-ubicacion">
      MUEY – SALINAS – ECUADOR
    </div>

  </footer>

</div>

</body>
</html>
`;
}

// =====================================================
// IMPRIMIR REGISTRO
// =====================================================

async imprimirRegistro(): Promise<void> {
  if (!this.confirmacionSeleccionada) {
    return;
  }

  try {
    const html = this.construirCertificado(
      this.confirmacionSeleccionada
    );

    const resultado =
      await window.iglesia.documentos.previsualizarImprimir(html);

    if (resultado && !resultado.success) {
      await this.mostrarAlerta(
        'No se pudo abrir',
        resultado.message || 'No fue posible abrir el certificado.'
      );
    }

  } catch (error: any) {
    console.error(
      '[CONFIRMACIONES] Error al imprimir:',
      error
    );

    await this.mostrarAlerta(
      'Error',
      error?.message || 'No se pudo generar el certificado.'
    );
  }
}

// =====================================================
// GUARDAR CERTIFICADO PDF
// =====================================================

async guardarPdf(): Promise<void> {
  if (!this.confirmacionSeleccionada) {
    return;
  }

  try {
    const html = this.construirCertificado(
      this.confirmacionSeleccionada
    );

    const resultado =
      await window.iglesia.documentos.guardarPdf(html);

    if (resultado?.success) {
      await this.mostrarAlerta(
        'Certificado generado',
        'El certificado de Confirmación en PDF se guardó correctamente.'
      );

    } else if (!resultado?.canceled) {
      await this.mostrarAlerta(
        'No se pudo guardar',
        resultado?.message || 'No se pudo generar el PDF.'
      );
    }

  } catch (error: any) {
    console.error(
      '[CONFIRMACIONES] Error al guardar PDF:',
      error
    );

    await this.mostrarAlerta(
      'Error',
      error?.message || 'No se pudo guardar el certificado.'
    );
  }
}

// =====================================================
// ENVIAR POR WHATSAPP
// =====================================================

async enviarPorWhatsApp(): Promise<void> {
  if (!this.confirmacionSeleccionada) {
    return;
  }

  try {
    const html = this.construirCertificado(
      this.confirmacionSeleccionada
    );

    const nombre = (
      `${this.confirmacionSeleccionada.nombres || ''} ` +
      `${this.confirmacionSeleccionada.apellidos || ''}`
    ).trim();

    const mensaje =
      `Certificado de Confirmación de ${nombre}. ` +
      'Adjunto encontrará el documento en formato PDF.';

    const resultado =
      await window.iglesia.documentos.prepararWhatsApp(
        html,
        mensaje
      );

    if (resultado?.success) {
      await this.mostrarAlerta(
        'WhatsApp preparado',
        'Se abrió WhatsApp y se preparó el certificado PDF. Adjunta el archivo que se muestra en la carpeta.'
      );

    } else if (resultado && !resultado.success) {
      await this.mostrarAlerta(
        'No se pudo preparar WhatsApp',
        resultado.message ||
        'No fue posible preparar el certificado.'
      );
    }

  } catch (error: any) {
    console.error(
      '[CONFIRMACIONES] Error al preparar WhatsApp:',
      error
    );

    await this.mostrarAlerta(
      'Error',
      error?.message ||
      'No se pudo preparar el certificado para WhatsApp.'
    );
  }
}



  // ==========================================
  // REGRESAR
  // ==========================================

  regresar(): void {
    this.router.navigate(['/confirmacion']);
  }
}