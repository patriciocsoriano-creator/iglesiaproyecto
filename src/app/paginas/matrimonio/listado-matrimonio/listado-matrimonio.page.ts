
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-matrimonio',
  templateUrl: './listado-matrimonio.page.html',
  styleUrls: ['./listado-matrimonio.page.scss'],
  standalone: false
})

export class ListadoMatrimonioPage implements OnInit {

  matrimonios: any[] = [];
  matrimonioSeleccionado: any = null;

  busqueda = '';
  cargando = false;
  consultandoDetalle = false;
  generandoPdf = false;
  preparandoWhatsApp = false;
  mensajeError = '';

  identidadParroquial: any = {};

  constructor(
    private alertController: AlertController,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarMatrimonios();
  }

  private get api(): any {
    return (window as any).iglesia;
  }

  async cargarMatrimonios(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const respuesta = await this.api.matrimonios.listar(
        this.busqueda.trim()
      );

      if (respuesta?.success === false) {
        throw new Error(respuesta.message || 'No se pudieron cargar los matrimonios.');
      }

      this.matrimonios = Array.isArray(respuesta)
        ? respuesta
        : respuesta?.data || [];

    } catch (error: any) {
      console.error('Error al cargar matrimonios:', error);
      this.mensajeError = error?.message || 'Ocurrió un error al cargar los registros.';
      this.matrimonios = [];
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  buscarMatrimonios(event: any): void {
    this.busqueda = event?.detail?.value || '';
    this.cargarMatrimonios();
  }

  async verDetalle(id: number): Promise<void> {
    this.consultandoDetalle = true;
    this.mensajeError = '';

    try {
      const [respuesta, identidad] = await Promise.all([
        this.api.matrimonios.obtener(id),
        this.api.parroco.obtener()
      ]);

      if (respuesta?.success === false) {
        throw new Error(respuesta.message || 'No se pudo obtener el matrimonio.');
      }

      this.matrimonioSeleccionado = respuesta?.data || respuesta;

      if (!this.matrimonioSeleccionado || !this.matrimonioSeleccionado.id) {
        throw new Error('No se encontró la información del matrimonio.');
      }

      this.identidadParroquial = identidad?.data || identidad || {};

    } catch (error: any) {
      console.error('Error al consultar matrimonio:', error);
      await this.mostrarAlerta(
        'Error',
        error?.message || 'No se pudo consultar el registro.'
      );
    } finally {
      this.consultandoDetalle = false;
      this.cdr.detectChanges();
    }
  }

  cerrarDetalle(): void {
    this.matrimonioSeleccionado = null;
  }

  nombreCompleto(tipo: 'esposo' | 'esposa'): string {
    if (!this.matrimonioSeleccionado) return '';

    const m = this.matrimonioSeleccionado;

    if (tipo === 'esposo') {
      return `${m.nombres_esposo || ''} ${m.apellidos_esposo || ''}`.trim();
    }

    return `${m.nombres_esposa || ''} ${m.apellidos_esposa || ''}`.trim();
  }

  formatoFecha(fecha: any): string {
    if (!fecha) return 'No registrado';

    const valor = String(fecha).substring(0, 10);
    const partes = valor.split('-');

    if (partes.length !== 3) return valor;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  fechaEnLetras(fecha: any): string {
    if (!fecha) return '';

    const valor = String(fecha).substring(0, 10);
    const partes = valor.split('-');

    if (partes.length !== 3) return valor;

    const dia = Number(partes[2]);
    const mes = Number(partes[1]);
    const anio = Number(partes[0]);

    const meses = [
      'enero', 'febrero', 'marzo', 'abril',
      'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return `${dia} de ${meses[mes - 1]} de ${anio}`;
  }

  fechaEmision(): string {
    return this.fechaEnLetras(new Date().toISOString().substring(0, 10));
  }

  texto(valor: any): string {
    if (valor === null || valor === undefined || String(valor).trim() === '') {
      return 'No registrado';
    }

    return String(valor);
  }

  private escaparHtml(valor: any): string {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private imagenHtml(data: string, tipo?: string): string {
    if (!data) return '';

    if (data.startsWith('data:')) return data;

    const mime = tipo || 'image/png';
    return `data:${mime};base64,${data}`;
  }

  private construirCertificadoHtml(): string {
    const m = this.matrimonioSeleccionado;
    const identidad = this.identidadParroquial;

    if (!m) return '';

    // La firma se toma del registro histórico del matrimonio.
    // No se reemplaza por la firma actual de Mantenimiento.
    const firmaHistorica = this.imagenHtml(
      m.parroco_firma_data,
      m.parroco_firma_tipo
    );

    const logoDiocesis = this.imagenHtml(
      identidad.logo_diocesis_data,
      identidad.logo_diocesis_tipo
    );

    const logoParroquia = this.imagenHtml(
      identidad.logo_parroquia_data,
      identidad.logo_parroquia_tipo
    );

    const sello = this.imagenHtml(
      identidad.sello_parroquia_data,
      identidad.sello_parroquia_tipo
    );

    const e = (valor: any) => this.escaparHtml(this.texto(valor));

    const esposo = this.nombreCompleto('esposo');
    const esposa = this.nombreCompleto('esposa');

    const fecha = this.fechaEnLetras(m.fecha_matrimonio);

    const datosFirma = e(m.parroco_nombre);
    const pieFirma = e(m.pie_firma);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Certificado de Matrimonio</title>

<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 0;
    font-family: Georgia, 'Times New Roman', serif;
    color: #243247;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .hoja {
    position: relative;
    width: 210mm;
    height: 297mm;
    padding: 9mm 13mm 8mm;
    overflow: hidden;
    background: #fff;
  }

  .marco {
    position: absolute;
    inset: 5mm;
    border: 1px solid #c49a45;
    pointer-events: none;
  }

  .cabecera {
    display: grid;
    grid-template-columns: 24mm 1fr 24mm;
    align-items: center;
    gap: 5mm;
    min-height: 27mm;
    border-bottom: 1.5px solid #c49a45;
    padding-bottom: 4mm;
  }

  .logo {
    width: 23mm;
    height: 23mm;
    object-fit: contain;
  }

  .institucion {
    text-align: center;
    line-height: 1.35;
  }

  .institucion .diocesis {
    font-size: 11pt;
    font-weight: bold;
    color: #17365d;
    text-transform: uppercase;
  }

  .institucion .vicaria {
    font-size: 9pt;
    color: #586579;
  }

  .institucion .parroquia {
    font-size: 12pt;
    font-weight: bold;
    color: #17365d;
    text-transform: uppercase;
  }

  .titulo {
    text-align: center;
    margin-top: 8mm;
  }

  .titulo h1 {
    font-size: 21pt;
    color: #17365d;
    letter-spacing: 2px;
    margin: 0;
    text-transform: uppercase;
  }

  .titulo .subtitulo {
    margin-top: 2mm;
    font-size: 9pt;
    color: #9b7835;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .ornamento {
    width: 35mm;
    height: 1px;
    background: #c49a45;
    margin: 3mm auto 5mm;
  }

  .registro {
    border: 1px solid #d9dfe8;
    background: #f7f8fa;
    border-radius: 2mm;
    padding: 3mm 4mm;
    margin-bottom: 4mm;
    font-size: 9pt;
  }

  .registro strong {
    color: #17365d;
  }

  .texto-intro {
    font-size: 10pt;
    line-height: 1.5;
    text-align: justify;
    margin: 3mm 0;
  }

  .seccion {
    margin-top: 3mm;
    page-break-inside: avoid;
  }

  .seccion-titulo {
    background: #17365d;
    color: #fff;
    padding: 2mm 3mm;
    font-size: 8.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: .5px;
  }

  .datos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2mm 5mm;
    padding: 3mm;
    border: 1px solid #e0e4ea;
    border-top: none;
  }

  .dato {
    font-size: 8.5pt;
    line-height: 1.35;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .dato strong {
    color: #17365d;
  }

  .ancho-completo {
    grid-column: 1 / -1;
  }

  .parrafo {
    font-size: 9pt;
    line-height: 1.45;
    text-align: justify;
    margin: 3mm 0;
  }

  .observacion {
    min-height: 10mm;
    padding: 3mm;
    border: 1px solid #e0e4ea;
    font-size: 8.5pt;
    line-height: 1.4;
  }

  .firma-area {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    align-items: end;
    margin-top: 9mm;
    min-height: 29mm;
  }

  .sello-area {
    text-align: center;
    min-height: 25mm;
  }

  .sello {
    max-width: 27mm;
    max-height: 25mm;
    object-fit: contain;
  }

  .firma {
    text-align: center;
    min-height: 25mm;
  }

  .firma-imagen {
    height: 15mm;
    max-width: 48mm;
    object-fit: contain;
    display: block;
    margin: 0 auto -1mm;
  }

  .linea-firma {
    width: 65mm;
    max-width: 100%;
    border-top: 1px solid #243247;
    margin: 0 auto 2mm;
  }

  .firma-nombre {
    font-size: 9pt;
    font-weight: bold;
    color: #17365d;
  }

  .firma-pie {
    font-size: 8pt;
    margin-top: 1mm;
  }

  .expedicion {
    text-align: center;
    font-size: 8.5pt;
    margin-top: 5mm;
  }

  .pie-institucional {
    position: absolute;
    left: 13mm;
    right: 13mm;
    bottom: 9mm;
    border-top: 1px solid #c49a45;
    padding-top: 2mm;
    text-align: center;
    font-size: 7.5pt;
    color: #687487;
  }

  @media print {
    html, body {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .hoja {
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
</style>
</head>

<body>
<div class="hoja">
  <div class="marco"></div>

  <header class="cabecera">
    <div>
      ${logoDiocesis ? `<img class="logo" src="${logoDiocesis}">` : ''}
    </div>

    <div class="institucion">
      <div class="diocesis">${e(identidad.diocesis_nombre || 'Diócesis de Santa Elena')}</div>
      <div class="vicaria">${e(identidad.vicaria_nombre || 'Vicaría San José')}</div>
      <div class="parroquia">${e(identidad.parroquia_nombre || 'Parroquia San Rafael Arcángel')}</div>
    </div>

    <div>
      ${logoParroquia ? `<img class="logo" src="${logoParroquia}">` : ''}
    </div>
  </header>

  <section class="titulo">
    <h1>Certificado de Matrimonio</h1>
    <div class="subtitulo">Registro sacramental</div>
    <div class="ornamento"></div>
  </section>

  <div class="registro">
    <strong>Registro parroquial:</strong>
    N.º ${e(m.numero_matrimonio)}
    &nbsp;&nbsp; | &nbsp;&nbsp;
    <strong>Tomo:</strong> ${e(m.tomo_matrimonio)}
    &nbsp;&nbsp; | &nbsp;&nbsp;
    <strong>Página:</strong> ${e(m.pagina_matrimonio)}
  </div>

  <p class="texto-intro">
    Certifico que en los libros de esta Parroquia consta inscrito el matrimonio
    celebrado entre las siguientes personas:
  </p>

  <section class="seccion">
    <div class="seccion-titulo">Datos del esposo</div>
    <div class="datos">
      <div class="dato ancho-completo"><strong>Nombres y apellidos:</strong> ${e(esposo)}</div>
      <div class="dato"><strong>Cédula:</strong> ${e(m.cedula_esposo)}</div>
      <div class="dato"><strong>Fecha de nacimiento:</strong> ${e(this.formatoFecha(m.fecha_nacimiento_esposo))}</div>
      <div class="dato ancho-completo"><strong>Lugar de nacimiento:</strong> ${e(m.lugar_nacimiento_esposo)}</div>
      <div class="dato"><strong>Padre:</strong> ${e(m.nombre_padre_esposo)}</div>
      <div class="dato"><strong>Madre:</strong> ${e(m.nombre_madre_esposo)}</div>
      <div class="dato ancho-completo"><strong>Parroquia de bautismo:</strong> ${e(m.parroquia_bautismo_esposo)}</div>
    </div>
  </section>

  <section class="seccion">
    <div class="seccion-titulo">Datos de la esposa</div>
    <div class="datos">
      <div class="dato ancho-completo"><strong>Nombres y apellidos:</strong> ${e(esposa)}</div>
      <div class="dato"><strong>Cédula:</strong> ${e(m.cedula_esposa)}</div>
      <div class="dato"><strong>Fecha de nacimiento:</strong> ${e(this.formatoFecha(m.fecha_nacimiento_esposa))}</div>
      <div class="dato ancho-completo"><strong>Lugar de nacimiento:</strong> ${e(m.lugar_nacimiento_esposa)}</div>
      <div class="dato"><strong>Padre:</strong> ${e(m.nombre_padre_esposa)}</div>
      <div class="dato"><strong>Madre:</strong> ${e(m.nombre_madre_esposa)}</div>
      <div class="dato ancho-completo"><strong>Parroquia de bautismo:</strong> ${e(m.parroquia_bautismo_esposa)}</div>
    </div>
  </section>

  <section class="seccion">
    <div class="seccion-titulo">Celebración del matrimonio</div>
    <div class="datos">
      <div class="dato"><strong>Fecha:</strong> ${e(fecha)}</div>
      <div class="dato"><strong>Lugar:</strong> ${e(m.lugar_matrimonio)}</div>
      <div class="dato ancho-completo"><strong>Ministro:</strong> ${e(m.ministro)}</div>
      <div class="dato"><strong>Testigo 1:</strong> ${e(m.testigo_1)}</div>
      <div class="dato"><strong>Testigo 2:</strong> ${e(m.testigo_2)}</div>
      <div class="dato"><strong>Padrino:</strong> ${e(m.padrino_boda)}</div>
      <div class="dato"><strong>Madrina:</strong> ${e(m.madrina_boda)}</div>
    </div>
  </section>

  <section class="seccion">
    <div class="seccion-titulo">Registro civil</div>
    <div class="datos">
      <div class="dato"><strong>Año:</strong> ${e(m.anio_registro_civil)}</div>
      <div class="dato"><strong>Libro:</strong> ${e(m.libro_registro_civil)}</div>
      <div class="dato"><strong>Folio:</strong> ${e(m.folio_registro_civil)}</div>
      <div class="dato"><strong>Acta:</strong> ${e(m.acta_registro_civil)}</div>
    </div>
  </section>

  <section class="seccion">
    <div class="seccion-titulo">Observaciones</div>
    <div class="observacion">${e(m.observacion)}</div>
  </section>

  <p class="parrafo">
    Para los fines que los interesados estimen convenientes, se expide el presente
    certificado en la Parroquia ${e(identidad.parroquia_nombre || 'San Rafael Arcángel')}.
  </p>

  <div class="expedicion">
    Expedido el ${this.escaparHtml(this.fechaEmision())}.
  </div>

  <div class="firma-area">
    <div class="sello-area">
      ${sello ? `<img class="sello" src="${sello}">` : ''}
    </div>

    <div class="firma">
      ${firmaHistorica ? `<img class="firma-imagen" src="${firmaHistorica}">` : '<div style="height:15mm"></div>'}
      <div class="linea-firma"></div>
      <div class="firma-nombre">${datosFirma}</div>
      <div class="firma-pie">${pieFirma}</div>
    </div>
  </div>

  <footer class="pie-institucional">
    ${e(identidad.direccion_parroquia || 'Parroquia San Rafael Arcángel de Muey')}
    ${identidad.telefono_parroquia ? ' | ' + e(identidad.telefono_parroquia) : ''}
  </footer>
</div>
</body>
</html>`;
  }

  async imprimirMatrimonio(): Promise<void> {
    if (!this.matrimonioSeleccionado) return;

    this.generandoPdf = true;

    try {
      const html = this.construirCertificadoHtml();

      const resultado = await this.api.documentos.guardarPdf(html);

      if (resultado?.success) {
        await this.mostrarAlerta(
          'Documento generado',
          'El certificado matrimonial se ha generado correctamente.'
        );
      } else if (!resultado?.canceled) {
        throw new Error(resultado?.message || 'No se pudo generar el documento.');
      }

    } catch (error: any) {
      console.error('Error al generar certificado:', error);
      await this.mostrarAlerta(
        'Error al generar',
        error?.message || 'No se pudo generar el certificado matrimonial.'
      );
    } finally {
      this.generandoPdf = false;
      this.cdr.detectChanges();
    }
  }

  async enviarWhatsApp(): Promise<void> {
    if (!this.matrimonioSeleccionado) return;

    this.preparandoWhatsApp = true;

    try {
      const m = this.matrimonioSeleccionado;

      const mensaje =
        `Certificado de matrimonio de ${this.nombreCompleto('esposo')} y ${this.nombreCompleto('esposa')}.`;

      const html = this.construirCertificadoHtml();

      const resultado = await this.api.documentos.prepararWhatsApp(
        html,
        mensaje
      );

      if (resultado?.success === false) {
        throw new Error(resultado.message || 'No se pudo preparar el documento.');
      }

    } catch (error: any) {
      console.error('Error al preparar WhatsApp:', error);
      await this.mostrarAlerta(
        'Error',
        error?.message || 'No se pudo preparar el documento para WhatsApp.'
      );
    } finally {
      this.preparandoWhatsApp = false;
      this.cdr.detectChanges();
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alerta.present();
  }

  regresar(): void {
    this.router.navigate(['/matrimonio']);
  }
}