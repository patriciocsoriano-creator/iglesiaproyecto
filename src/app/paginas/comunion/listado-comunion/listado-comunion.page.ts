import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listado-comunion',
  templateUrl: './listado-comunion.page.html',
  styleUrls: ['./listado-comunion.page.scss'],
  standalone: false,
})
export class ListadoComunionPage implements OnInit {

  comuniones: any[] = [];
  comunionSeleccionada: any = null;

  parroco: any = null;

  busqueda = '';

  cargando = false;
  cargandoDetalle = false;
  errorCarga = '';

  constructor(
    private alertController: AlertController,
    private router: Router,
    private changeDetector: ChangeDetectorRef
  ) {}

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  ngOnInit(): void {
    this.cargarComuniones();
    this.cargarConfiguracionParroquial();
  }

  // =====================================================
  // CARGAR CONFIGURACIÓN PARROQUIAL
  // =====================================================

  async cargarConfiguracionParroquial(): Promise<void> {
    try {
      const resultado = await window.iglesia.parroco.obtener();

      this.parroco = resultado || {};

    } catch (error) {
      console.error(
        '[COMUNIONES] Error al cargar configuración:',
        error
      );
    }

    this.changeDetector.detectChanges();
  }

  // =====================================================
  // CARGAR PRIMERAS COMUNIONES
  // =====================================================

  async cargarComuniones(): Promise<void> {
    this.cargando = true;
    this.errorCarga = '';

    try {
      const resultado = await window.iglesia.comuniones.listar(
        this.busqueda.trim()
      );

      this.comuniones = Array.isArray(resultado)
        ? resultado
        : [];

    } catch (error: any) {
      console.error(
        '[COMUNIONES] Error al cargar registros:',
        error
      );

      this.errorCarga =
        error?.message ||
        'No se pudieron cargar los registros de Primera Comunión.';

      this.comuniones = [];

    } finally {
      this.cargando = false;
      this.changeDetector.detectChanges();
    }
  }

  // =====================================================
  // BUSCAR PRIMERAS COMUNIONES
  // =====================================================

  async buscarComuniones(): Promise<void> {
    await this.cargarComuniones();
  }

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================

  async limpiarBusqueda(): Promise<void> {
    this.busqueda = '';
    await this.cargarComuniones();
  }

  // =====================================================
  // CONSULTAR DETALLE DE UNA COMUNIÓN
  // =====================================================

  async consultarComunion(comunion: any): Promise<void> {
    if (!comunion || !comunion.id) {
      return;
    }

    this.cargandoDetalle = true;
    this.comunionSeleccionada = null;

    try {
      const resultado = await window.iglesia.comuniones.obtener(
        Number(comunion.id)
      );

      if (!resultado) {
        await this.mostrarAlerta(
          'Registro no encontrado',
          'No se encontró la información de esta Primera Comunión.'
        );

        return;
      }

      this.comunionSeleccionada = resultado;

    } catch (error: any) {
      console.error(
        '[COMUNIONES] Error al consultar registro:',
        error
      );

      await this.mostrarAlerta(
        'Error',
        error?.message ||
        'No se pudo consultar el registro de Primera Comunión.'
      );

    } finally {
      this.cargandoDetalle = false;
      this.changeDetector.detectChanges();
    }
  }

  // =====================================================
  // CERRAR CONSULTA
  // =====================================================

  cerrarConsulta(): void {
    this.comunionSeleccionada = null;
  }

  // =====================================================
  // FORMATEAR FECHAS
  // =====================================================

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '';
    }

    const partes = String(fecha).substring(0, 10).split('-');

    if (partes.length !== 3) {
      return String(fecha);
    }

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
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
  // CONSTRUIR CERTIFICADO DE PRIMERA COMUNIÓN
  // =====================================================

  

construirCertificado(comunion: any): string {
  if (!comunion) {
    throw new Error(
      'No existe un registro para generar el certificado.'
    );
  }

  const configuracion = this.parroco || {};

  const diocesis = this.escaparHtml(
    configuracion.diocesis_nombre || 'Diócesis de Santa Elena'
  );

  const vicaria = this.escaparHtml(
    configuracion.vicaria_nombre || 'Vicaría San José'
  );

  let parroquia = String(
    configuracion.parroquia_nombre || 'San Rafael Arcángel de Muey'
  ).trim();

  parroquia = parroquia.replace(/^parroquia\s+/i, '');

  const parroquiaHtml = this.escaparHtml(parroquia);

  const nombreCompleto = this.escaparHtml(
    `${comunion.nombres || ''} ${comunion.apellidos || ''}`.trim()
  ).toUpperCase();

  const padre = this.escaparHtml(
    comunion.nombre_padre || 'No registrado'
  );

  const madre = this.escaparHtml(
    comunion.nombre_madre || 'No registrada'
  );

  const padrino = this.escaparHtml(
    comunion.padrino || 'No registrado'
  );

  const madrina = this.escaparHtml(
    comunion.madrina || 'No registrada'
  );

  const lugarNacimiento = this.escaparHtml(
    comunion.lugar_nacimiento || 'No registrado'
  );

  const parroquiaBautismo = this.escaparHtml(
    comunion.parroquia_bautismo || 'No registrada'
  );

  const ministro = this.escaparHtml(
    comunion.ministro || 'No registrado'
  );

  const lugarComunion = this.escaparHtml(
    comunion.lugar_comunion || 'José Luis Tamayo'
  );

  const cedula = this.escaparHtml(
    comunion.cedula || 'No registrada'
  );

  // Se conserva la firma histórica del párroco.
  const nombreParroco = this.escaparHtml(
    comunion.parroco_nombre ||
    configuracion.parroco_nombre ||
    'Párroco'
  );

  const pieFirma = this.escaparHtml(
    comunion.pie_firma || 'Párroco'
  );

  const fechaNacimiento = this.fechaEnTexto(
    comunion.fecha_nacimiento
  );

  const fechaBautismo = this.fechaEnTexto(
    comunion.fecha_bautismo
  );

  const fechaComunion = this.fechaEnTexto(
    comunion.fecha_comunion
  );

  const fechaActual = this.fechaEnTexto(
    this.obtenerFechaActual()
  );

  // Datos del registro parroquial.
  const numero = this.escaparHtml(
    comunion.numero_comunion || '—'
  );

  const tomo = this.escaparHtml(
    comunion.tomo_comunion || '—'
  );

  const pagina = this.escaparHtml(
    comunion.pagina_comunion || '—'
  );

  const anioComunion = comunion.fecha_comunion
    ? String(comunion.fecha_comunion).substring(0, 4)
    : '—';

  // Imágenes institucionales.
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

  // Firma histórica guardada al registrar la Primera Comunión.
  const firma = this.obtenerImagen(
    comunion.parroco_firma_data,
    comunion.parroco_firma_tipo
  );

  const imagenD = logoDiocesis
    ? `<img src="${logoDiocesis}" class="logo logo-diocesis" alt="Diócesis">`
    : '<div class="espacio-logo"></div>';

  const imagenP = logoParroquia
    ? `<img src="${logoParroquia}" class="logo logo-parroquia" alt="Parroquia">`
    : '<div class="espacio-logo"></div>';

  const imagenSello = sello
    ? `<img src="${sello}" class="sello" alt="Sello parroquial">`
    : '';

  const imagenFirma = firma
    ? `<img src="${firma}" class="firma" alt="Firma del párroco">`
    : '';

  // Datos de contacto: se utilizan los valores de configuración
  // si existen; de lo contrario, se conservan los del certificado modelo.
  const direccion = this.escaparHtml(
    configuracion.direccion_parroquia ||
    'Barrio Centenario, Calle 13'
  );

  const telefono = this.escaparHtml(
    configuracion.telefono_parroquia ||
    configuracion.telefono ||
    '0963267862'
  );

  const correo = this.escaparHtml(
    configuracion.correo_parroquial ||
    configuracion.email ||
    'parroquiasanrafaelarcangel1998@gmail.com'
  );

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Certificado de Primera Comunión</title>

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
  width: 210mm;
  height: 297mm;
  margin: 0;
  padding: 0;
  font-family: Georgia, 'Times New Roman', serif;
  color: #172b46;
  background: #faf9f5;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.documento {
  position: relative;
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  padding: 0;
  background: #faf9f5;
}

/* =========================================
   ENCABEZADO INSTITUCIONAL
========================================= */

.encabezado {
  position: absolute;
  top: 10mm;
  left: 13mm;
  right: 13mm;
  height: 27mm;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.logo {
  position: absolute;
  top: 0;
  width: 23mm;
  height: 23mm;
  object-fit: contain;
}

.logo-diocesis {
  left: 0;
}

.logo-parroquia {
  right: 0;
}

.espacio-logo {
  position: absolute;
  top: 0;
  width: 23mm;
  height: 23mm;
}

.encabezado-centro {
  width: 125mm;
  padding: 0 3mm;
}

.diocesis {
  font-size: 12pt;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 0 1.5mm;
  color: #153252;
}

.vicaria {
  font-size: 10pt;
  font-style: italic;
  color: #756345;
  margin: 0 0 1.5mm;
}

.parroquia {
  font-size: 12pt;
  font-weight: bold;
  color: #153252;
  margin: 0 0 1mm;
}

.sector {
  font-size: 9.5pt;
  font-style: italic;
  color: #64748b;
  margin: 0;
}

/* =========================================
   LÍNEA DORADA DEL ENCABEZADO
========================================= */

.linea-encabezado {
  position: absolute;
  top: 37mm;
  left: 13mm;
  right: 13mm;
  height: 0;
  border-top: 0.45mm solid #c49a43;
}

/* =========================================
   TÍTULO SACRAMENTAL
========================================= */

.rotulo-documento {
  position: absolute;
  top: 42mm;
  left: 15mm;
  right: 15mm;
  text-align: center;
  font-size: 10pt;
  font-weight: bold;
  letter-spacing: 3px;
  color: #806b45;
}

.titulo {
  position: absolute;
  top: 47mm;
  left: 18mm;
  right: 18mm;
  margin: 0;
  text-align: center;
  font-size: 25pt;
  line-height: 1.05;
  font-weight: bold;
  letter-spacing: 1px;
  color: #153252;
  text-transform: uppercase;
}

.adorno-titulo {
  position: absolute;
  top: 67mm;
  left: 57mm;
  right: 57mm;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4mm;
}

.adorno-titulo::before,
.adorno-titulo::after {
  content: '';
  flex: 1;
  height: 0;
  border-top: 0.3mm solid #c49a43;
}

.estrella {
  color: #bd913c;
  font-size: 15pt;
  line-height: 1;
}

.lugar-fecha {
  position: absolute;
  top: 70mm;
  left: 15mm;
  right: 15mm;
  text-align: right;
  font-size: 10pt;
  color: #64748b;
}

/* =========================================
   DISTRIBUCIÓN DE DOS COLUMNAS
========================================= */

.contenido {
  position: absolute;
  top: 79mm;
  left: 13mm;
  right: 13mm;
  bottom: 53mm;
  display: grid;
  grid-template-columns: 55mm 1fr;
  column-gap: 7mm;
}

/* =========================================
   COLUMNA IZQUIERDA
========================================= */

.columna-izquierda {
  position: relative;
  padding-right: 4mm;
}

.separador-columnas {
  position: absolute;
  top: 0;
  bottom: 0;
  right: -3.5mm;
  width: 0;
  border-right: 0.35mm solid #bd913c;
}

.bloque-lateral {
  margin-bottom: 8mm;
}

.titulo-lateral {
  min-height: 8mm;
  display: flex;
  align-items: center;
  padding: 1.5mm 3mm;
  margin-bottom: 2.5mm;
  background: #153252;
  color: #fff;
  border-radius: 1.5mm;
  border-left: 1.2mm solid #c49a43;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8.5pt;
  font-weight: bold;
  letter-spacing: .5px;
  text-transform: uppercase;
}

.fila-lateral {
  display: grid;
  grid-template-columns: 19mm 1fr;
  gap: 1mm;
  padding: 1mm 1mm;
  font-size: 9pt;
  line-height: 1.25;
  color: #26384e;
}

.fila-lateral strong {
  font-weight: bold;
}

.valor-lateral {
  overflow-wrap: anywhere;
}

.texto-lateral {
  padding: 1mm 1.5mm;
  font-size: 9pt;
  line-height: 1.4;
  color: #26384e;
  overflow-wrap: anywhere;
}

/* =========================================
   COLUMNA DERECHA
========================================= */

.columna-derecha {
  padding-left: 1mm;
  font-size: 11.5pt;
  line-height: 1.48;
  color: #172b46;
  text-align: justify;
}

.columna-derecha p {
  margin: 0 0 3.5mm;
  text-align: justify;
}

.columna-derecha strong {
  font-weight: bold;
}

.nombre-comulgante {
  margin: 3mm 0 4mm !important;
  text-align: center !important;
  font-size: 13pt;
  line-height: 1.3;
  font-weight: bold;
  color: #153252;
  letter-spacing: .3px;
}

.padrinos {
  margin-top: 2mm !important;
  margin-bottom: 3mm !important;
}

.nombre-padrinos {
  margin: 0 0 2mm !important;
  padding-left: 4mm;
  font-weight: bold;
  line-height: 1.5;
}

.registro-final {
  margin-top: 4mm !important;
  text-align: left !important;
}

/* =========================================
   SELLO PARROQUIAL
========================================= */

.sello {
  position: absolute;
  width: 27mm;
  height: 27mm;
  object-fit: contain;
  right: 10mm;
  bottom: 7mm;
  opacity: .95;
}

/* =========================================
   FIRMA
========================================= */

.firma-contenedor {
  position: absolute;
  left: 55mm;
  right: 55mm;
  bottom: 25mm;
  height: 29mm;
  text-align: center;
  z-index: 2;
}

.firma {
  display: block;
  width: 42mm;
  height: 13mm;
  object-fit: contain;
  margin: 0 auto -1mm;
}

.linea-firma {
  width: 62mm;
  border-top: 0.4mm solid #153252;
  margin: 0 auto 1mm;
}

.nombre-firmante {
  font-size: 10pt;
  font-weight: bold;
  color: #153252;
  margin: 0 0 1mm;
}

.cargo {
  font-size: 9pt;
  font-style: italic;
  color: #806b45;
}

/* =========================================
   PIE DE PÁGINA AZUL MARINO
========================================= */

.decoracion-pie {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 26mm;
  height: 2mm;
  background: #e4c77e;
  border-top: .35mm solid #bd913c;
  border-bottom: .35mm solid #bd913c;
}

.pie {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 25mm;
  padding: 4mm 12mm 2mm;
  text-align: center;
  background: #153252;
  color: #fff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 7.3pt;
  line-height: 1.5;
}

.pie strong {
  display: block;
  color: #e7c879;
  font-size: 8pt;
  letter-spacing: 1px;
  margin-bottom: 1mm;
}

.pie-contacto {
  white-space: nowrap;
  font-size: 7pt;
}

.pie-sector {
  color: #e7c879;
  letter-spacing: 2px;
  font-size: 7.5pt;
  margin-top: 1mm;
}

/* =========================================
   IMPRESIÓN A4
========================================= */

@media print {
  html,
  body {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #faf9f5 !important;
  }

  .documento {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    overflow: hidden !important;
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
}

</style>
</head>

<body>

<div class="documento">

  <!-- ENCABEZADO -->
  <header class="encabezado">

    ${imagenD}

    <div class="encabezado-centro">
      <div class="diocesis">${diocesis}</div>
      <div class="vicaria">${vicaria}</div>
      <div class="parroquia">Parroquia ${parroquiaHtml}</div>
      <div class="sector">José Luis Tamayo (Muey)</div>
    </div>

    ${imagenP}

  </header>

  <div class="linea-encabezado"></div>

  <!-- TÍTULO -->
  <div class="rotulo-documento">
    DOCUMENTO SACRAMENTAL
  </div>

  <h1 class="titulo">
    CERTIFICADO DE PRIMERA<br>
    COMUNIÓN
  </h1>

  <div class="adorno-titulo">
    <span class="estrella">✦</span>
  </div>

  <div class="lugar-fecha">
    José Luis Tamayo, ${fechaActual}
  </div>

  <!-- CUERPO EN DOS COLUMNAS -->
  <main class="contenido">

    <!-- COLUMNA IZQUIERDA -->
    <aside class="columna-izquierda">

      <div class="bloque-lateral">
        <div class="titulo-lateral">
          REGISTRO PARROQUIAL
        </div>

        <div class="fila-lateral">
          <strong>N.º:</strong>
          <span class="valor-lateral">${numero}</span>
        </div>

        <div class="fila-lateral">
          <strong>Año:</strong>
          <span class="valor-lateral">${this.escaparHtml(anioComunion)}</span>
        </div>

        <div class="fila-lateral">
          <strong>Tomo:</strong>
          <span class="valor-lateral">${tomo}</span>
        </div>

        <div class="fila-lateral">
          <strong>Página:</strong>
          <span class="valor-lateral">${pagina}</span>
        </div>
      </div>

      <div class="bloque-lateral">
        <div class="titulo-lateral">
          DATOS PERSONALES
        </div>

        <div class="fila-lateral">
          <strong>Nacimiento:</strong>
          <span class="valor-lateral">${this.escaparHtml(fechaNacimiento)}</span>
        </div>

        <div class="fila-lateral">
          <strong>Lugar:</strong>
          <span class="valor-lateral">${lugarNacimiento}</span>
        </div>

        <div class="fila-lateral">
          <strong>Cédula:</strong>
          <span class="valor-lateral">${cedula}</span>
        </div>
      </div>

      <div class="bloque-lateral">
        <div class="titulo-lateral">
          DATOS DEL BAUTISMO
        </div>

        <div class="texto-lateral">
          <strong>Parroquia:</strong><br>
          ${parroquiaBautismo}
        </div>

        <div class="texto-lateral">
          <strong>Fecha:</strong><br>
          ${this.escaparHtml(fechaBautismo)}
        </div>
      </div>

      <div class="bloque-lateral">
        <div class="titulo-lateral">
          PADRINOS
        </div>

        <div class="texto-lateral">
          <strong>Padrino:</strong><br>
          ${padrino}
        </div>

        <div class="texto-lateral">
          <strong>Madrina:</strong><br>
          ${madrina}
        </div>
      </div>

      <div class="separador-columnas"></div>

    </aside>

    <!-- COLUMNA DERECHA -->
    <section class="columna-derecha">

      <p>
        El infrascrito, <strong>${nombreParroco}</strong>,
        Párroco de la Iglesia
        <strong>"${parroquiaHtml}"</strong>,
        CERTIFICA que en los archivos de esta parroquia
        consta el registro de Primera Comunión que corresponde a:
      </p>

      <p class="nombre-comulgante">
        ${nombreCompleto}
      </p>

      <p>
        Hijo(a) de <strong>${padre}</strong> y
        <strong>${madre}</strong>, nacido(a) en
        <strong>${lugarNacimiento}</strong>,
        el día <strong>${this.escaparHtml(fechaNacimiento)}</strong>.
      </p>

      <p>
        Recibió el sacramento del Bautismo en
        <strong>${parroquiaBautismo}</strong>,
        el día <strong>${this.escaparHtml(fechaBautismo)}</strong>.
      </p>

      <p>
        Recibió por primera vez la Sagrada Eucaristía
        en <strong>${lugarComunion}</strong>,
        el día <strong>${this.escaparHtml(fechaComunion)}</strong>,
        siendo ministro de este sacramento
        <strong>${ministro}</strong>.
      </p>

      <p class="padrinos">
        Fueron sus padrinos de Primera Comunión:
      </p>

      <p class="nombre-padrinos">
        ${padrino}<br>
        ${madrina}
      </p>

      <p>
        Es fiel copia del original que reposa en nuestros archivos.
      </p>

      <p class="registro-final">
        <strong>
          Tomo:</strong> ${tomo}
        &nbsp;&nbsp;
        <strong>Página:</strong> ${pagina}
        &nbsp;&nbsp;
        <strong>N.º:</strong> ${numero}
      </p>

    </section>

  </main>

  <!-- SELLO -->
  ${imagenSello}

  <!-- FIRMA HISTÓRICA -->
  <section class="firma-contenedor">

    ${imagenFirma}

    <div class="linea-firma"></div>

    <div class="nombre-firmante">
      ${nombreParroco}
    </div>

    <div class="cargo">
      ${pieFirma}
    </div>

  </section>

  <!-- FRANJA INFERIOR -->
  <div class="decoracion-pie"></div>

  <footer class="pie">

    <strong>PARROQUIA SAN RAFAEL ARCÁNGEL</strong>

    <div class="pie-contacto">
      Dir.: ${direccion}
      &nbsp; | &nbsp;
      Teléf.: ${telefono}
      &nbsp; | &nbsp;
      E-mail: ${correo}
    </div>

    <div class="pie-sector">
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
    if (!this.comunionSeleccionada) {
      return;
    }

    try {
      const html = this.construirCertificado(
        this.comunionSeleccionada
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
        '[COMUNIONES] Error al imprimir:',
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
    if (!this.comunionSeleccionada) {
      return;
    }

    try {
      const html = this.construirCertificado(
        this.comunionSeleccionada
      );

      const resultado =
        await window.iglesia.documentos.guardarPdf(html);

      if (resultado?.success) {
        await this.mostrarAlerta(
          'Certificado generado',
          'El certificado PDF se guardó correctamente.'
        );

      } else if (!resultado?.canceled) {
        await this.mostrarAlerta(
          'No se pudo guardar',
          resultado?.message || 'No se pudo generar el PDF.'
        );
      }

    } catch (error: any) {
      console.error(
        '[COMUNIONES] Error al guardar PDF:',
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
    if (!this.comunionSeleccionada) {
      return;
    }

    try {
      const html = this.construirCertificado(
        this.comunionSeleccionada
      );

      const nombre = (
        `${this.comunionSeleccionada.nombres || ''} ` +
        `${this.comunionSeleccionada.apellidos || ''}`
      ).trim();

      const mensaje =
        `Certificado de Primera Comunión de ${nombre}. ` +
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
        '[COMUNIONES] Error al preparar WhatsApp:',
        error
      );

      await this.mostrarAlerta(
        'Error',
        error?.message ||
        'No se pudo preparar el certificado para WhatsApp.'
      );
    }
  }

  // =====================================================
  // REGRESAR AL MÓDULO DE COMUNIÓN
  // =====================================================

  regresar(): void {
    this.router.navigate(['/comunion']);
  }

  // =====================================================
  // MOSTRAR ALERTA
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

}
