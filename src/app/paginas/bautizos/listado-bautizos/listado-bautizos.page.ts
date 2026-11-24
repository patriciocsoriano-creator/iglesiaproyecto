import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-bautizos',
  templateUrl: './listado-bautizos.page.html',
  styleUrls: ['./listado-bautizos.page.scss'],
  standalone: false
})
export class ListadoBautizosPage implements OnInit {

  bautizos: any[] = [];
  busqueda = '';

  cargando = false;
  consultandoDetalle = false;
  mensajeError = '';

  generandoPdf = false;
  imprimiendo = false;
  preparandoWhatsApp = false;

  bautizoSeleccionado: any = null;

  // =====================================================
// EDICIÓN DE BAUTIZOS
// =====================================================

editandoBautizo = false;
guardandoCambios = false;

bautizoEdicion: any = null;

  parrocoVigente: any = {
    nombre: '',
    pieFirma: 'Párroco',
    firmaData: '',
    firmaTipo: '',
    firmaPreview: '',

    diocesisNombre: '',
    vicariaNombre: '',
    parroquiaNombre: '',

    logoDiocesisData: '',
    logoDiocesisTipo: '',
    logoParroquiaData: '',
    logoParroquiaTipo: '',

    selloParroquiaData: '',
selloParroquiaTipo: ''
  };

  constructor(
    private alertController: AlertController,
    private router: Router,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarBautizos();
  }

  // =====================================================
  // CARGAR BAUTIZOS
  // =====================================================

  async cargarBautizos(): Promise<void> {

    this.cargando = true;
    this.mensajeError = '';

    try {

      const api = (window as any).iglesia;

      if (!api?.bautizos?.listar) {
        throw new Error(
          'No está disponible la conexión con SQLite.'
        );
      }

      const resultado = await api.bautizos.listar(
        this.busqueda.trim()
      );

      if (!Array.isArray(resultado)) {
        throw new Error('La respuesta del listado no es válida.');
      }

      this.bautizos = resultado;

    } catch (error: any) {

      console.error('Error al cargar bautizos:', error);

      this.mensajeError =
        error?.message || 'No se pudieron cargar los bautizos.';

    } finally {

      this.cargando = false;
      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
  // BUSCADOR
  // =====================================================

  async buscarBautizos(event: any): Promise<void> {
    this.busqueda = event?.detail?.value || '';
    await this.cargarBautizos();
  }

  // =====================================================
  // CONSULTAR DETALLE
  // =====================================================

  async verDetalle(id: number): Promise<void> {

    this.consultandoDetalle = true;
    this.bautizoSeleccionado = null;

    try {

      const api = (window as any).iglesia;

      if (!api?.bautizos?.obtener || !api?.parroco?.obtener) {
        throw new Error(
          'No están disponibles los servicios de consulta.'
        );
      }

      const [bautizo, parroco] = await Promise.all([
        api.bautizos.obtener(id),
        api.parroco.obtener()
      ]);

      if (!bautizo) {
        throw new Error('No se encontró el bautismo solicitado.');
      }

      const identidad = parroco?.identidad || parroco || {};

      this.parrocoVigente = {
        nombre: parroco?.parroco_nombre || '',
        pieFirma: parroco?.pie_firma || 'Párroco',
        firmaData: parroco?.parroco_firma_data || '',
        firmaTipo: parroco?.parroco_firma_tipo || '',
        firmaPreview: '',

        diocesisNombre:
          identidad.diocesis_nombre || 'Diócesis de Santa Elena',

        vicariaNombre:
          identidad.vicaria_nombre || 'Vicaría “San José”',

        parroquiaNombre:
          identidad.parroquia_nombre || 'Parroquia “San Rafael Arcángel”',

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
      };

      if (
        this.parrocoVigente.firmaData &&
        this.parrocoVigente.firmaTipo
      ) {
        this.parrocoVigente.firmaPreview =
          this.crearDataUrl(
            this.parrocoVigente.firmaData,
            this.parrocoVigente.firmaTipo
          );
      }

      this.bautizoSeleccionado = bautizo;

    } catch (error: any) {

      console.error('Error al consultar bautizo:', error);

      await this.mostrarAlerta(
        'Error de consulta',
        error?.message || 'No se pudo consultar el bautismo.'
      );

    } finally {

      this.consultandoDetalle = false;
      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
  // CERRAR DETALLE
  // =====================================================

  cerrarDetalle(): void {

  if (this.guardandoCambios) {
    return;
  }

  this.editandoBautizo = false;
  this.bautizoEdicion = null;
  this.bautizoSeleccionado = null;
}

  // =====================================================
  // FORMATO DE FECHAS
  // =====================================================

  formatoFecha(fecha: string): string {

    if (!fecha) {
      return 'No especificada';
    }

    const partes = String(fecha).substring(0, 10).split('-');

    if (partes.length !== 3) {
      return String(fecha);
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private fechaEnLetras(fecha: string): string {

    if (!fecha) {
      return 'fecha no especificada';
    }

    const partes = String(fecha).substring(0, 10).split('-');

    if (partes.length !== 3) {
      return String(fecha);
    }

    const fechaLocal = new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    );

    return new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Guayaquil'
    }).format(fechaLocal);
  }

  private fechaEmision(): string {

    return new Intl.DateTimeFormat('es-EC', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Guayaquil'
    }).format(new Date());
  }

  // =====================================================
  // IMÁGENES Y TEXTO SEGURO
  // =====================================================

  private escaparHtml(valor: any): string {

    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private texto(valor: any, alternativo = 'No registrado'): string {
    const limpio = String(valor ?? '').trim();
    return this.escaparHtml(limpio || alternativo);
  }

  private crearDataUrl(data: string, tipo: string): string {

    if (!data) {
      return '';
    }

    if (data.startsWith('data:')) {
      return data;
    }

    return `data:${tipo || 'image/png'};base64,${data}`;
  }

  /**
   * Convierte el logotipo a PNG para incrustarlo en el certificado.
   * Si el formato original ya es PNG, conserva la imagen.
   */
  private async convertirImagenAPng(
    data: string,
    tipo: string
  ): Promise<string> {

    if (!data) {
      return '';
    }

    const dataUrl = this.crearDataUrl(data, tipo || 'image/png');

    if (dataUrl.startsWith('data:image/png')) {
      return dataUrl;
    }

    return new Promise((resolve) => {

      const imagen = new Image();

      imagen.onload = () => {

        try {

          const canvas = document.createElement('canvas');

          canvas.width = imagen.naturalWidth || imagen.width;
          canvas.height = imagen.naturalHeight || imagen.height;

          const contexto = canvas.getContext('2d');

          if (!contexto) {
            resolve(dataUrl);
            return;
          }

          contexto.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          contexto.drawImage(imagen, 0, 0);

          resolve(canvas.toDataURL('image/png'));

        } catch (error) {

          console.warn(
            'No se pudo convertir el logo a PNG:',
            error
          );

          resolve(dataUrl);

        }
      };

      imagen.onerror = () => resolve(dataUrl);
      imagen.src = dataUrl;

    });
  }

  private imagenHtml(
    data: string,
    tipo: string,
    clase: string,
    alt: string
  ): string {

    if (!data) {
      return '';
    }

    const src = this.crearDataUrl(data, tipo);

    return `
      <img
        class="${clase}"
        src="${this.escaparHtml(src)}"
        alt="${this.escaparHtml(alt)}">
    `;
  }
    // =====================================================
  // CONSTRUIR CERTIFICADO DE BAUTISMO
  // DISEÑO PREMIUM A4
  // =====================================================

  private async construirCertificadoHtml(): Promise<string> {

    const b = this.bautizoSeleccionado;
    const p = this.parrocoVigente;

    if (!b) {
      throw new Error('No hay un bautismo seleccionado.');
    }

    const nombreParroco = p.nombre || 'Párroco no configurado';
    const diocesis = p.diocesisNombre || 'Diócesis de Santa Elena';
    const vicaria = p.vicariaNombre || 'Vicaría “San José”';
    const parroquia = p.parroquiaNombre || 'Parroquia “San Rafael Arcángel”';

    const nombreBautizado = [
      b.nombres_bautizado || '',
      b.apellidos_bautizado || ''
    ].join(' ').trim().toUpperCase();

    const fechaBautizo = this.fechaEnLetras(b.fecha_bautizo);
    const fechaNacimiento = this.fechaEnLetras(b.fecha_nacimiento);

    const anioBautizo = b.fecha_bautizo
      ? String(b.fecha_bautizo).substring(0, 4)
      : 'No registrado';

    const lugarNacimiento = this.texto(
      b.lugar_nacimiento,
      'lugar no especificado'
    );

    // Convertir ambos logotipos a PNG.
    const logoDiocesisPng = await this.convertirImagenAPng(
      p.logoDiocesisData,
      p.logoDiocesisTipo
    );

    const logoParroquiaPng = await this.convertirImagenAPng(
      p.logoParroquiaData,
      p.logoParroquiaTipo
    );

    // Convertir el sello parroquial a PNG.
const selloParroquiaPng = await this.convertirImagenAPng(
  p.selloParroquiaData,
  p.selloParroquiaTipo
);

    const logoDiocesis = this.imagenHtml(
      logoDiocesisPng,
      'image/png',
      'logo',
      'Logo de la Diócesis'
    );

    const logoParroquia = this.imagenHtml(
      logoParroquiaPng,
      'image/png',
      'logo',
      'Logo de la Parroquia'
    );

    // Imagen del sello oficial.
const selloParroquia = this.imagenHtml(
  selloParroquiaPng,
  'image/png',
  'sello-img',
  'Sello oficial de la parroquia'
);

const selloHtml = selloParroquia
  ? `<div class="sello-contenedor">${selloParroquia}</div>`
  : '';

    // Firma vigente del párroco configurada en Mantenimiento.
    let firmaHtml = '';

    const firmaSrc = p.firmaPreview ||
      (p.firmaData
        ? this.crearDataUrl(
            p.firmaData,
            p.firmaTipo || 'image/png'
          )
        : '');

    if (firmaSrc) {
      firmaHtml = `
        <img
          class="firma-img"
          src="${this.escaparHtml(firmaSrc)}"
          alt="Firma del párroco">
      `;
    }

    const ministro = this.texto(
      b.ministro,
      'ministro no registrado'
    );

    const padre = this.texto(b.nombre_padre, 'No registrado');
    const madre = this.texto(b.nombre_madre, 'No registrada');
    const padrino = this.texto(b.padrino, 'No registrado');
    const madrina = this.texto(b.madrina, 'No registrada');

    const notaMarginal = this.texto(b.nota_marginal, '');

    const numero = this.texto(b.numero_bautizo);
    const tomoBautizo = this.texto(b.tomo_bautizo);
    const folioBautizo = this.texto(b.pagina_bautizo);

    const anioCivil = this.texto(b.anio_registro);
    const tomoCivil = this.texto(b.tomo_registro);
    const paginaCivil = this.texto(b.pagina_registro);
    const actaCivil = this.texto(b.acta_registro);
    const lugarCivil = this.texto(b.lugar_registro);

    const nombreParrocoHtml = this.escaparHtml(nombreParroco);
    const pieFirma = this.escaparHtml(p.pieFirma || 'Párroco');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificado de Bautismo</title>


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
    color: #17243a;
    background: #fbfaf6;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .hoja {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 10mm 13mm 0;
    overflow: hidden;
    background: #fbfaf6;
  }

  .contenido {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  /* ENCABEZADO INSTITUCIONAL */

  .cabecera {
    position: relative;
    display: grid;
    grid-template-columns: 25mm minmax(0, 1fr) 25mm;
    align-items: center;
    gap: 4mm;
    min-height: 25mm;
    padding: 1mm 2mm 4mm;
    border-bottom: .45mm solid #c49a45;
    text-align: center;
    flex-shrink: 0;
  }

  .cabecera::after {
  display: none;
}

  .logo-contenedor {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25mm;
    height: 22mm;
    background: transparent;
  }

  .logo {
    display: block;
    max-width: 23mm;
    max-height: 21mm;
    width: auto;
    height: auto;
    object-fit: contain;
    background: transparent;
    border: none;
  }

  .institucion {
    min-width: 0;
    line-height: 1.25;
  }

  .institucion .diocesis {
    color: #102d50;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 1.1px;
    text-transform: uppercase;
  }

  .institucion .vicaria {
    margin-top: 1mm;
    color: #6c5a3c;
    font-size: 10px;
    font-style: italic;
  }

  .institucion .parroquia {
    margin-top: 1mm;
    color: #102d50;
    font-size: 12px;
    font-weight: bold;
  }

  .institucion .ubicacion {
    margin-top: .5mm;
    color: #596477;
    font-size: 9px;
    font-style: italic;
  }

  /* TÍTULO DEL CERTIFICADO */

  .bloque-titulo {
    text-align: center;
    flex-shrink: 0;
    padding-top: 5mm;
  }

  .titulo-superior {
    color: #6b5837;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 3px;
  }

  .titulo {
    margin: 0;
    color: #102d50;
    font-size: 34px;
    line-height: 1.05;
    font-weight: bold;
    letter-spacing: 2.2px;
  }

  .ornamento {
    position: relative;
    width: 95mm;
    height: 2mm;
    margin: 2.5mm auto 0;
    border-top: .45mm solid #c49a45;
  }

  .ornamento::before {
    content: '✦';
    position: absolute;
    top: -3.2mm;
    left: 50%;
    padding: 0 3mm;
    color: #b88a35;
    background: #fbfaf6;
    font-size: 15px;
    transform: translateX(-50%);
  }

  .fecha-emision {
    margin: 1mm 1mm 4mm;
    color: #596477;
    font-size: 9.5px;
    text-align: right;
    flex-shrink: 0;
  }

  /* CUERPO DEL CERTIFICADO */

  .cuerpo {
    position: relative;
    display: grid;
    grid-template-columns: 55mm minmax(0, 1fr);
    column-gap: 7mm;
    flex: 1;
    min-height: 0;
    padding-top: 2mm;
    padding-bottom: 2mm;
  }

  /* COLUMNA IZQUIERDA */

  .columna-izquierda {
    display: flex;
    flex-direction: column;
    gap: 8mm;
    min-width: 0;
    padding-right: 4mm;
    border-right: .45mm solid #c49a45;
  }

  .bloque-lateral {
    min-width: 0;
  }

  .bloque-lateral h3 {
    margin: 0 0 2mm;
    padding: 1.7mm 2.5mm;
    color: #fff;
    background: #102d50;
    border-left: 1mm solid #c49a45;
    border-radius: 1.2mm;
    font-family: Arial, sans-serif;
    font-size: 8.5px;
    font-weight: bold;
    letter-spacing: .65px;
  }

  .linea-dato {
    display: grid;
    grid-template-columns: 18mm minmax(0, 1fr);
    gap: 1mm;
    margin: 1.5mm 1mm;
    color: #202a38;
    font-size: 9.5px;
    line-height: 1.25;
  }

  .linea-dato strong {
    color: #243b58;
    white-space: nowrap;
  }

  .linea-dato span {
    overflow-wrap: anywhere;
  }

  .nota {
    min-height: 8mm;
    padding: 0 1mm;
    color: #202a38;
    font-size: 9px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  /* COLUMNA DERECHA: TRANSCRIPCIÓN */

  .columna-derecha {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0;
    min-width: 0;
    padding: 0;
  }

  .certificacion,
  .parrafo,
  .cierre {
    margin: 0;
    color: #17243a;
    font-size: 13px;
    line-height: 1.6;
    text-align: justify;
  }

  .certificacion {
    margin-bottom: 8px;
  }

  .certificacion strong {
    color: #102d50;
  }

  /* PÁRRAFO DE PARROQUIA, FECHA Y MINISTRO */

  .transcripcion {
    display: block;
    margin: 0;
    padding: 0;
  }

  .parrafo-partida {
    margin: 0 0 20px;
    color: #17243a;
    font-size: 13px;
    line-height: 1.6;
    text-align: justify;
  }

  /* NOMBRE DEL BAUTIZADO */

  .nombre-bautizado {
    margin: 8px 0 14px;
    color: #102d50;
    font-size: 15px;
    font-weight: bold;
    letter-spacing: .45px;
    line-height: 1.3;
    text-align: center;
    overflow-wrap: anywhere;
  }

  /* PADRES Y NACIMIENTO */

  .parrafo {
    margin: 0 0 12px;
  }

  /* PADRINOS */

  .padrinos {
    margin: 0 0 12px;
    color: #17243a;
    font-size: 13px;
    line-height: 1.6;
  }

  .padrinos div {
    margin-top: 2px;
    overflow-wrap: anywhere;
  }

  .cierre {
    margin-top: 4px;
  }

  /* SELLO OFICIAL DE LA PARROQUIA */

.sello-contenedor {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32mm;
  margin-top: auto;
  padding: 5mm 0;
}

.sello-img {
  display: block;
  max-width: 30mm;
  max-height: 30mm;
  width: auto;
  height: auto;
  object-fit: contain;
  background: transparent;
  border: none;
}

  /* FIRMA */

  .firma-contenedor {
    position: relative;
    z-index: 1;
    width: 76mm;
    min-height: 25mm;
    margin: 3mm auto 2.5mm;
    text-align: center;
    flex-shrink: 0;
  }

  .firma-img {
    display: block;
    max-width: 58mm;
    max-height: 13mm;
    width: auto;
    height: auto;
    object-fit: contain;
    margin: 0 auto 1mm;
    background: transparent;
  }

  .linea-firma {
    width: 62mm;
    margin: 0 auto 1.5mm;
    border-top: .35mm solid #102d50;
  }

  .nombre-firma {
    color: #102d50;
    font-size: 10.5px;
    font-weight: bold;
  }

  .cargo-firma {
    margin-top: .5mm;
    color: #6b5837;
    font-size: 9px;
    font-style: italic;
  }

  /* PIE INSTITUCIONAL */

  .pie {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1mm;
    min-height: 19mm;
    margin: 0 -13mm;
    padding: 3mm 14mm;
    color: #fff;
    background: #102d50;
    border-top: 1mm solid #c49a45;
    text-align: center;
    font-family: Arial, sans-serif;
    font-size: 8px;
    line-height: 1.35;
    flex-shrink: 0;
  }

  .pie::before {
    content: '';
    position: absolute;
    top: -2mm;
    left: 0;
    right: 0;
    height: 1mm;
    background: #e4c47c;
  }

  .pie strong {
    color: #f0d69c;
    font-size: 8.5px;
    letter-spacing: .8px;
  }

  .pie .direccion {
    color: #fff;
  }

  .pie .ubicacion-pie {
    color: #f0d69c;
    letter-spacing: 1.2px;
  }

  /* VISTA PREVIA */

  @media screen {

    html,
    body {
      width: 100%;
      height: auto;
      min-height: 100vh;
      background: #e9edf2;
    }

    .hoja {
      margin: 20px auto;
      box-shadow: 0 10px 35px rgba(13, 31, 52, .2);
    }

    .barra-acciones {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      width: 210mm;
      margin: 0 auto 15px;
      font-family: Arial, sans-serif;
    }

    .barra-acciones button {
      padding: 10px 20px;
      border: 0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
    }

    .btn-imprimir {
      color: #fff;
      background: #102d50;
    }

    .btn-cerrar {
      color: #102d50;
      background: #fff;
      border: 1px solid #cbd3df !important;
    }
  }

  /* IMPRESIÓN A4 */

  @media print {

    .barra-acciones {
      display: none !important;
    }

    html,
    body {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fbfaf6 !important;
      overflow: hidden !important;
    }

    .hoja {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
    }
  }


/* =========================================
   AUMENTO DE TAMAÑO DE LETRA DEL CERTIFICADO
========================================= */

/* Fecha de emisión */
.fecha-emision {
  font-size: 10.5px;
}

/* Identidad institucional */
.institucion .diocesis {
  font-size: 13px;
}

.institucion .vicaria {
  font-size: 11px;
}

.institucion .parroquia {
  font-size: 13px;
}

.institucion .ubicacion {
  font-size: 10px;
}

/* Encabezados de registros */
.bloque-lateral h3 {
  font-size: 9.5px;
}

/* Datos del registro parroquial y civil */
.linea-dato {
  font-size: 10.5px;
}

/* Nota marginal */
.nota {
  font-size: 10px;
}

/* Texto principal del certificado */
.certificacion,
.parrafo,
.cierre,
.parrafo-partida {
  font-size: 14px;
}

/* Nombre del bautizado */
.nombre-bautizado {
  font-size: 16px;
}

/* Información de padrinos */
.padrinos {
  font-size: 14px;
}



</style>

</head>

<body>

  <div class="barra-acciones">
    <button class="btn-cerrar" onclick="window.close()">
      Cerrar vista previa
    </button>

    <button class="btn-imprimir" onclick="window.print()">
      Imprimir certificado
    </button>
  </div>

  <main class="hoja">

    <div class="contenido">

      <header class="cabecera">

        <div class="logo-contenedor">
          ${logoDiocesis}
        </div>

        <div class="institucion">
          <div class="diocesis">
            ${this.escaparHtml(diocesis)}
          </div>

          <div class="vicaria">
            ${this.escaparHtml(vicaria)}
          </div>

          <div class="parroquia">
            ${this.escaparHtml(parroquia)}
          </div>

          <div class="ubicacion">
            José Luis Tamayo (Muey)
          </div>
        </div>

        <div class="logo-contenedor">
          ${logoParroquia}
        </div>

      </header>

      <section class="bloque-titulo">

        <div class="titulo-superior">
          DOCUMENTO SACRAMENTAL
        </div>

        <h1 class="titulo">
          CERTIFICADO DE<br>BAUTISMO
        </h1>

        <div class="ornamento"></div>

      </section>

      <div class="fecha-emision">
        José Luis Tamayo, ${this.escaparHtml(this.fechaEmision())}
      </div>

      <section class="cuerpo">

        <!-- COLUMNA IZQUIERDA -->

        <aside class="columna-izquierda">

          <div class="bloque-lateral">

            <h3>REGISTRO PARROQUIAL</h3>

            <div class="linea-dato">
              <strong>N.º:</strong>
              <span>${numero}</span>
            </div>

            <div class="linea-dato">
              <strong>Año:</strong>
              <span>${this.escaparHtml(anioBautizo)}</span>
            </div>

            <div class="linea-dato">
              <strong>Tomo:</strong>
              <span>${tomoBautizo}</span>
            </div>

            <div class="linea-dato">
              <strong>Folio:</strong>
              <span>${folioBautizo}</span>
            </div>

          </div>

          <div class="bloque-lateral">

            <h3>REGISTRO CIVIL</h3>

            <div class="linea-dato">
              <strong>Año:</strong>
              <span>${anioCivil}</span>
            </div>

            <div class="linea-dato">
              <strong>Tomo:</strong>
              <span>${tomoCivil}</span>
            </div>

            <div class="linea-dato">
              <strong>Página:</strong>
              <span>${paginaCivil}</span>
            </div>

            <div class="linea-dato">
              <strong>Acta:</strong>
              <span>${actaCivil}</span>
            </div>

            <div class="linea-dato">
              <strong>Lugar:</strong>
              <span>${lugarCivil}</span>
            </div>

            <div class="linea-dato">
  <strong>Cédula:</strong>
  <span>${this.texto(b.cedula)}</span>
</div>

          </div>

          <div class="bloque-lateral">

            <h3>NOTA MARGINAL</h3>

            <div class="nota">
              ${notaMarginal === '' ? 'Ninguna' : notaMarginal}
            </div>

          </div>

        </aside>

        <!-- COLUMNA DERECHA: TEXTO COMPLETO DEL ACTA -->

        <article class="columna-derecha">

          <p class="certificacion">
            El infrascrito,
            <strong>Rvdo. P. ${nombreParrocoHtml}</strong>,
            <strong>CERTIFICA</strong> en forma legal que, en el libro
            especial de bautizos de este despacho parroquial se halla
            una partida que copiada literalmente dice:
          </p>

          <div class="transcripcion">

  <p class="parrafo-partida">
    En la ${this.escaparHtml(parroquia)}, el día
    ${this.escaparHtml(fechaBautizo)},
    <strong>${ministro}</strong>, bautizó solemnemente a:
  </p>

  <div class="nombre-bautizado">
    ${this.escaparHtml(nombreBautizado)}
  </div>

</div>

          <p class="parrafo">
            Hijo(a) legítimo(a) de <strong>${padre}</strong> y de
            <strong>${madre}</strong>. Nacido(a) en ${lugarNacimiento}
            el día ${this.escaparHtml(fechaNacimiento)}.
          </p>

          <div class="padrinos">

            Siendo sus padrinos:

            <div>
              <strong>${padrino}</strong>
            </div>

            <div>
              <strong>${madrina}</strong>
            </div>

          </div>

          <p class="parrafo">
            Quienes quedaron advertidos del parentesco espiritual
            y obligaciones contraídas.
          </p>

          <p class="cierre">
            Es fiel copia del Original que reposa en nuestros archivos.
            Cualquier cambio se puede realizar con la partida de nacimiento.
          </p>

          ${selloHtml}


        </article>

      </section>

      <div class="firma-contenedor">

        ${firmaHtml}

        <div class="linea-firma"></div>

        <div class="nombre-firma">
          Rvdo. P. ${nombreParrocoHtml}
        </div>

        <div class="cargo-firma">
          ${pieFirma}
        </div>

      </div>

      <footer class="pie">

        <strong>PARROQUIA SAN RAFAEL ARCÁNGEL</strong>

        <div class="direccion">
          Dir.: Barrio Centenario, Calle 13
          &nbsp; | &nbsp;
          Teléf.: 0963267862
          &nbsp; | &nbsp;
          E-mail: parroquiasanrafaelarcangel1998@gmail.com
        </div>

        <div class="ubicacion-pie">
          MUEY – SALINAS – ECUADOR
        </div>

      </footer>

    </div>

  </main>

</body>
</html>
    `;
  }
    // =====================================================
  // GENERAR Y GUARDAR CERTIFICADO PDF
  // =====================================================

  async imprimirBautizo(): Promise<void> {

    if (!this.bautizoSeleccionado || this.generandoPdf) {
      return;
    }

    this.generandoPdf = true;
    this.imprimiendo = true;

    try {

      const api = (window as any).iglesia;

      if (!api?.documentos?.guardarPdf) {
        throw new Error(
          'No está disponible el servicio para guardar PDF de Electron.'
        );
      }

      const html = await this.construirCertificadoHtml();

      const resultado =
        await api.documentos.guardarPdf(html);

      if (resultado?.canceled) {
        return;
      }

      if (!resultado?.success) {
        throw new Error(
          resultado?.message ||
          'No se pudo generar el certificado PDF.'
        );
      }

      await this.mostrarAlerta(
        'PDF generado correctamente',
        'El certificado de bautismo se guardó correctamente en la ubicación seleccionada.'
      );

    } catch (error: any) {

      console.error(
        'Error al generar certificado PDF:',
        error
      );

      await this.mostrarAlerta(
        'Error al generar PDF',
        error?.message || 'No se pudo guardar el certificado.'
      );

    } finally {

      this.generandoPdf = false;
      this.imprimiendo = false;

      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
  // PREPARAR CERTIFICADO PARA WHATSAPP
  // =====================================================

  async enviarWhatsApp(): Promise<void> {

    if (!this.bautizoSeleccionado || this.generandoPdf) {
      return;
    }

    this.generandoPdf = true;
    this.preparandoWhatsApp = true;

    try {

      const api = (window as any).iglesia;

      if (!api?.documentos?.prepararWhatsApp) {
        throw new Error(
          'No está disponible el servicio de documentos de Electron.'
        );
      }

      const html = await this.construirCertificadoHtml();

      const b = this.bautizoSeleccionado;

      const nombreBautizado = [
        b.nombres_bautizado || '',
        b.apellidos_bautizado || ''
      ].join(' ').trim();

      const mensaje = [
        'CERTIFICADO DE BAUTISMO',
        '',
        `Bautizado(a): ${nombreBautizado}`,
        `Número de bautizo: ${b.numero_bautizo || 'No registrado'}`,
        `Fecha del bautismo: ${this.formatoFecha(b.fecha_bautizo)}`,
        '',
        'Parroquia San Rafael Arcángel de Muey.'
      ].join('\n');

      const resultado =
        await api.documentos.prepararWhatsApp(html, mensaje);

      if (!resultado?.success) {
        throw new Error(
          resultado?.message || 'No se pudo preparar el PDF.'
        );
      }

      await this.mostrarAlerta(
        'Certificado preparado',
        'Se abrió WhatsApp Web y se mostró el archivo PDF en el Explorador. Selecciona el contacto y adjunta el certificado para enviarlo.'
      );

    } catch (error: any) {

      console.error(
        'Error al preparar WhatsApp:',
        error
      );

      await this.mostrarAlerta(
        'Error al preparar WhatsApp',
        error?.message || 'No se pudo preparar el certificado.'
      );

    } finally {

      this.generandoPdf = false;
      this.preparandoWhatsApp = false;

      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
// INICIAR EDICIÓN DE BAUTIZO
// =====================================================

iniciarEdicion(): void {

  if (!this.bautizoSeleccionado || this.guardandoCambios) {
    return;
  }

  // Copia independiente para no alterar el detalle original
  // hasta que SQLite confirme la actualización.
  this.bautizoEdicion = {
    ...this.bautizoSeleccionado,

    fecha_bautizo: String(
      this.bautizoSeleccionado.fecha_bautizo || ''
    ).substring(0, 10),

    fecha_nacimiento: String(
      this.bautizoSeleccionado.fecha_nacimiento || ''
    ).substring(0, 10),

    cedula: this.bautizoSeleccionado.cedula || '',
    tomo_bautizo: this.bautizoSeleccionado.tomo_bautizo || '',
    pagina_bautizo: this.bautizoSeleccionado.pagina_bautizo || '',
    lugar_nacimiento: this.bautizoSeleccionado.lugar_nacimiento || '',
    nombre_padre: this.bautizoSeleccionado.nombre_padre || '',
    nombre_madre: this.bautizoSeleccionado.nombre_madre || '',
    padrino: this.bautizoSeleccionado.padrino || '',
    madrina: this.bautizoSeleccionado.madrina || '',
    anio_registro: this.bautizoSeleccionado.anio_registro || '',
    tomo_registro: this.bautizoSeleccionado.tomo_registro || '',
    pagina_registro: this.bautizoSeleccionado.pagina_registro || '',
    acta_registro: this.bautizoSeleccionado.acta_registro || '',
    lugar_registro: this.bautizoSeleccionado.lugar_registro || '',
    nota_marginal: this.bautizoSeleccionado.nota_marginal || ''
  };

  this.editandoBautizo = true;
}


// =====================================================
// CANCELAR EDICIÓN
// =====================================================

cancelarEdicion(): void {

  if (this.guardandoCambios) {
    return;
  }

  this.editandoBautizo = false;
  this.bautizoEdicion = null;
}


// =====================================================
// GUARDAR CAMBIOS DEL BAUTIZO
// =====================================================

async guardarCambios(): Promise<void> {

  if (!this.bautizoEdicion || this.guardandoCambios) {
    return;
  }

  const b = this.bautizoEdicion;

  // Validación de campos obligatorios
  const obligatorios = [
    { campo: 'numero_bautizo', nombre: 'Número de bautizo' },
    { campo: 'fecha_bautizo', nombre: 'Fecha del bautizo' },
    { campo: 'lugar_bautizo', nombre: 'Lugar del bautizo' },
    { campo: 'ministro', nombre: 'Ministro' },
    { campo: 'nombres_bautizado', nombre: 'Nombres del bautizado' },
    { campo: 'apellidos_bautizado', nombre: 'Apellidos del bautizado' },
    { campo: 'fecha_nacimiento', nombre: 'Fecha de nacimiento' }
  ];

  for (const elemento of obligatorios) {

    if (!String(b[elemento.campo] ?? '').trim()) {

      await this.mostrarAlerta(
        'Campo obligatorio',
        `Debes completar el campo: ${elemento.nombre}.`
      );

      return;
    }
  }

  this.guardandoCambios = true;

  try {

    const api = (window as any).iglesia;

    if (!api?.bautizos?.actualizar) {
      throw new Error(
        'No está disponible el servicio de actualización de bautizos.'
      );
    }

    // Se envían exclusivamente los campos editables.
    // No se envían parroco_nombre ni pie_firma:
    // la firma histórica debe permanecer intacta.

    const datos = {
      id: b.id,

      numero_bautizo: String(b.numero_bautizo).trim(),
      fecha_bautizo: b.fecha_bautizo,
      tomo_bautizo: String(b.tomo_bautizo ?? '').trim(),
      pagina_bautizo: String(b.pagina_bautizo ?? '').trim(),
      lugar_bautizo: String(b.lugar_bautizo).trim(),
      ministro: String(b.ministro).trim(),

      nombres_bautizado: String(b.nombres_bautizado).trim(),
      apellidos_bautizado: String(b.apellidos_bautizado).trim(),
      lugar_nacimiento: String(b.lugar_nacimiento ?? '').trim(),
      fecha_nacimiento: b.fecha_nacimiento,

      nombre_padre: String(b.nombre_padre ?? '').trim(),
      nombre_madre: String(b.nombre_madre ?? '').trim(),
      padrino: String(b.padrino ?? '').trim(),
      madrina: String(b.madrina ?? '').trim(),

      cedula: String(b.cedula ?? '').trim(),
      anio_registro: String(b.anio_registro ?? '').trim(),
      tomo_registro: String(b.tomo_registro ?? '').trim(),
      pagina_registro: String(b.pagina_registro ?? '').trim(),
      acta_registro: String(b.acta_registro ?? '').trim(),
      lugar_registro: String(b.lugar_registro ?? '').trim(),

      nota_marginal: String(b.nota_marginal ?? '').trim()
    };

    const resultado = await api.bautizos.actualizar(datos);

    if (!resultado?.success) {
      throw new Error(
        resultado?.message || 'No se pudo actualizar el bautismo.'
      );
    }

    const idActualizado = Number(b.id);

    this.editandoBautizo = false;
    this.bautizoEdicion = null;

    // Actualizar tabla y conservar el filtro de búsqueda.
    await this.cargarBautizos();

    // Consultar nuevamente el registro actualizado.
    await this.verDetalle(idActualizado);

    await this.mostrarAlerta(
      'Bautismo actualizado',
      'Los datos del bautismo se actualizaron correctamente.'
    );

  } catch (error: any) {

    console.error(
      'Error al actualizar bautizo:',
      error
    );

    await this.mostrarAlerta(
      'Error al actualizar',
      error?.message || 'No se pudieron guardar los cambios.'
    );

  } finally {

    this.guardandoCambios = false;
    this.changeDetector.detectChanges();

  }
}

  // =====================================================
  // ALERTAS
  // =====================================================

  async mostrarAlerta(
    titulo: string,
    mensaje: string
  ): Promise<void> {

    const alerta = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alerta.present();
  }

  // =====================================================
  // REGRESAR
  // =====================================================

  regresar(): void {
    this.router.navigateByUrl('/bautizos');
  }

}