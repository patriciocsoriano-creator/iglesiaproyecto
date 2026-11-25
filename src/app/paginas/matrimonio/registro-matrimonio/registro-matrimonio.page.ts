import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IglesiaSqliteService } from '../../../servicios/iglesia-sqlite';

@Component({
  selector: 'app-registro-matrimonio',
  templateUrl: './registro-matrimonio.page.html',
  styleUrls: ['./registro-matrimonio.page.scss'],
  standalone: false
})
export class RegistroMatrimonioPage implements OnInit {

  cargandoParroco = true;
  guardando = false;
  mensajeError = '';

  matrimonioGuardado = false;
  matrimonioId: number | null = null;

  lugaresCelebracion: string[] = [
    'Parroquia San Rafael Arcángel de Muey',
    'Divina Misericordia',
    'Capilla Santa Ana',
    'Capilla Virgen del Cisne'
  ];

  parroco = {
    nombre: '',
    pieFirma: 'Párroco',
    firmaData: '',
    firmaTipo: '',
    firmaPreview: ''
  };

  matrimonio = this.crearMatrimonioVacio();

  buscandoEsposo = false;
  buscandoEsposa = false;

  mensajeBusquedaEsposo = '';
  mensajeBusquedaEsposa = '';

  private ultimaCedulaEsposo = '';
  private ultimaCedulaEsposa = '';

  constructor(
    private alertController: AlertController,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private iglesiaSqlite: IglesiaSqliteService
  ) {}

  ngOnInit(): void {
    this.cargarParrocoVigente();
  }

  private esIOS(): boolean {
    return Capacitor.isNativePlatform();
  }

  private obtenerFilas(resultado: any): any[] {
    if (Array.isArray(resultado)) {
      return resultado;
    }

    if (Array.isArray(resultado?.values)) {
      return resultado.values;
    }

    if (Array.isArray(resultado?.rows)) {
      return resultado.rows;
    }

    return [];
  }

  // =====================================================
  // MODELO INICIAL DEL MATRIMONIO
  // =====================================================

  private crearMatrimonioVacio(): any {
    return {
      numero_matrimonio: '',
      fecha_matrimonio: '',
      tomo_matrimonio: '',
      pagina_matrimonio: '',
      lugar_matrimonio: '',
      ministro: '',

      nombres_esposo: '',
      apellidos_esposo: '',
      cedula_esposo: '',
      fecha_nacimiento_esposo: '',
      lugar_nacimiento_esposo: '',
      nombre_padre_esposo: '',
      nombre_madre_esposo: '',
      parroquia_bautismo_esposo: '',

      nombres_esposa: '',
      apellidos_esposa: '',
      cedula_esposa: '',
      fecha_nacimiento_esposa: '',
      lugar_nacimiento_esposa: '',
      nombre_padre_esposa: '',
      nombre_madre_esposa: '',
      parroquia_bautismo_esposa: '',

      padrino_boda: '',
      madrina_boda: '',

      testigo_1: '',
      testigo_2: '',

      anio_registro_civil: '',
      libro_registro_civil: '',
      folio_registro_civil: '',
      acta_registro_civil: '',

      observacion: ''
    };
  }

  // =====================================================
  // CARGAR CONFIGURACIÓN DEL PÁRROCO
  // =====================================================

  async cargarParrocoVigente(): Promise<void> {
    this.cargandoParroco = true;
    this.mensajeError = '';

    try {
      let resultado: any;

      if (this.esIOS()) {
        const consulta = await this.iglesiaSqlite.consultar(
          'SELECT * FROM configuracion_parroquial WHERE id = 1 LIMIT 1',
          []
        );

        resultado = this.obtenerFilas(consulta)[0];
      } else {
        const api = (window as any).iglesia;

        if (!api?.parroco?.obtener) {
          throw new Error(
            'No se encuentra disponible la conexión con la base de datos.'
          );
        }

        resultado = await api.parroco.obtener();
      }

      if (!resultado) {
        throw new Error('No se pudo obtener la configuración parroquial.');
      }

      this.parroco.nombre = resultado.parroco_nombre || '';
      this.parroco.pieFirma = resultado.pie_firma || 'Párroco';
      this.parroco.firmaData = resultado.parroco_firma_data || '';
      this.parroco.firmaTipo = resultado.parroco_firma_tipo || '';

      this.actualizarVistaFirma();

    } catch (error: any) {
      console.error('Error al cargar configuración parroquial:', error);

      this.mensajeError =
        error?.message || 'No se pudieron cargar los datos del párroco.';

    } finally {
      this.cargandoParroco = false;
      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // VISTA PREVIA DE LA FIRMA
  // =====================================================

  actualizarVistaFirma(): void {
    const firma = this.parroco.firmaData || '';

    if (!firma) {
      this.parroco.firmaPreview = '';
      return;
    }

    this.parroco.firmaPreview =
      firma.startsWith('data:image/')
        ? firma
        : `data:${this.parroco.firmaTipo || 'image/png'};base64,${firma}`;
  }

  // =====================================================
  // VALIDAR FORMULARIO
  // =====================================================

  validarFormulario(): boolean {
    const obligatorios: {
      campo: string;
      valor: string;
    }[] = [
      {
        campo: 'Número de matrimonio',
        valor: this.matrimonio.numero_matrimonio
      },
      {
        campo: 'Fecha de matrimonio',
        valor: this.matrimonio.fecha_matrimonio
      },
      {
        campo: 'Lugar de celebración',
        valor: this.matrimonio.lugar_matrimonio
      },
      {
        campo: 'Ministro',
        valor: this.matrimonio.ministro
      },
      {
        campo: 'Nombres del esposo',
        valor: this.matrimonio.nombres_esposo
      },
      {
        campo: 'Apellidos del esposo',
        valor: this.matrimonio.apellidos_esposo
      },
      {
        campo: 'Nombres de la esposa',
        valor: this.matrimonio.nombres_esposa
      },
      {
        campo: 'Apellidos de la esposa',
        valor: this.matrimonio.apellidos_esposa
      }
    ];

    for (const item of obligatorios) {
      if (
        typeof item.valor !== 'string' ||
        !item.valor.trim()
      ) {
        this.mensajeError =
          `El campo "${item.campo}" es obligatorio.`;

        return false;
      }
    }

    const fechaMatrimonio = this.matrimonio.fecha_matrimonio;

    if (
      this.matrimonio.fecha_nacimiento_esposo &&
      this.matrimonio.fecha_nacimiento_esposo > fechaMatrimonio
    ) {
      this.mensajeError =
        'La fecha de nacimiento del esposo no puede ser posterior a la fecha del matrimonio.';

      return false;
    }

    if (
      this.matrimonio.fecha_nacimiento_esposa &&
      this.matrimonio.fecha_nacimiento_esposa > fechaMatrimonio
    ) {
      this.mensajeError =
        'La fecha de nacimiento de la esposa no puede ser posterior a la fecha del matrimonio.';

      return false;
    }

    if (!this.parroco.nombre.trim()) {
      this.mensajeError =
        'Primero debe configurar el nombre del párroco en Mantenimiento.';

      return false;
    }

    return true;
  }

  // =====================================================
  // PREPARAR DATOS DEL MATRIMONIO
  // =====================================================

  private prepararDatos(): any {
    return {
      numero_matrimonio: this.matrimonio.numero_matrimonio.trim(),
      fecha_matrimonio: this.matrimonio.fecha_matrimonio,
      tomo_matrimonio: this.matrimonio.tomo_matrimonio.trim(),
      pagina_matrimonio: this.matrimonio.pagina_matrimonio.trim(),
      lugar_matrimonio: this.matrimonio.lugar_matrimonio.trim(),
      ministro: this.matrimonio.ministro.trim(),

      nombres_esposo: this.matrimonio.nombres_esposo.trim(),
      apellidos_esposo: this.matrimonio.apellidos_esposo.trim(),
      cedula_esposo: this.matrimonio.cedula_esposo.trim(),
      fecha_nacimiento_esposo: this.matrimonio.fecha_nacimiento_esposo,
      lugar_nacimiento_esposo: this.matrimonio.lugar_nacimiento_esposo.trim(),
      nombre_padre_esposo: this.matrimonio.nombre_padre_esposo.trim(),
      nombre_madre_esposo: this.matrimonio.nombre_madre_esposo.trim(),
      parroquia_bautismo_esposo: this.matrimonio.parroquia_bautismo_esposo.trim(),

      nombres_esposa: this.matrimonio.nombres_esposa.trim(),
      apellidos_esposa: this.matrimonio.apellidos_esposa.trim(),
      cedula_esposa: this.matrimonio.cedula_esposa.trim(),
      fecha_nacimiento_esposa: this.matrimonio.fecha_nacimiento_esposa,
      lugar_nacimiento_esposa: this.matrimonio.lugar_nacimiento_esposa.trim(),
      nombre_padre_esposa: this.matrimonio.nombre_padre_esposa.trim(),
      nombre_madre_esposa: this.matrimonio.nombre_madre_esposa.trim(),
      parroquia_bautismo_esposa: this.matrimonio.parroquia_bautismo_esposa.trim(),

      padrino_boda: this.matrimonio.padrino_boda.trim(),
      madrina_boda: this.matrimonio.madrina_boda.trim(),

      testigo_1: this.matrimonio.testigo_1.trim(),
      testigo_2: this.matrimonio.testigo_2.trim(),

      anio_registro_civil: this.matrimonio.anio_registro_civil.trim(),
      libro_registro_civil: this.matrimonio.libro_registro_civil.trim(),
      folio_registro_civil: this.matrimonio.folio_registro_civil.trim(),
      acta_registro_civil: this.matrimonio.acta_registro_civil.trim(),

      observacion: this.matrimonio.observacion.trim()
    };
  }

  // =====================================================
  // GUARDAR MATRIMONIO
  // =====================================================

  async guardarMatrimonio(): Promise<void> {
    if (this.guardando) {
      return;
    }

    this.mensajeError = '';
    this.matrimonioGuardado = false;
    this.matrimonioId = null;

    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;

    try {
      const datos = this.prepararDatos();
      let idGuardado: number;

      if (this.esIOS()) {

        // COMPROBAR SI EL NÚMERO YA EXISTE
        const duplicado = await this.iglesiaSqlite.consultar(
          `SELECT id FROM matrimonios
           WHERE numero_matrimonio = ?
           LIMIT 1`,
          [datos.numero_matrimonio]
        );

        if (this.obtenerFilas(duplicado).length > 0) {
          throw new Error(
            'Ya existe un matrimonio registrado con ese número.'
          );
        }

        // LA TABLA SQLITE UTILIZA UNA SOLA COLUMNA PARA LOS PADRINOS.
        const padrinosBoda = [
          datos.padrino_boda
            ? `Padrino: ${datos.padrino_boda}`
            : '',
          datos.madrina_boda
            ? `Madrina: ${datos.madrina_boda}`
            : ''
        ].filter(Boolean).join(' | ');

        const resultado: any = await this.iglesiaSqlite.ejecutarCambios(
          `INSERT INTO matrimonios (
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
            nombres_esposa,
            apellidos_esposa,
            cedula_esposa,
            fecha_nacimiento_esposa,
            lugar_nacimiento_esposa,
            nombre_padre_esposa,
            nombre_madre_esposa,
            testigo_1,
            testigo_2,
            parroco_nombre,
            pie_firma,
            parroco_firma_data,
            parroco_firma_tipo,
            fecha_creacion,
            fecha_actualizacion,
            parroquia_bautismo_esposo,
            parroquia_bautismo_esposa,
            padrinos_boda,
            anio_registro_civil,
            libro_registro_civil,
            folio_registro_civil,
            acta_registro_civil,
            observacion
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, datetime('now','localtime'),
            datetime('now','localtime'), ?, ?, ?, ?, ?, ?, ?, ?
          )`,
          [
            datos.numero_matrimonio,
            datos.fecha_matrimonio,
            datos.tomo_matrimonio,
            datos.pagina_matrimonio,
            datos.lugar_matrimonio,
            datos.ministro,

            datos.nombres_esposo,
            datos.apellidos_esposo,
            datos.cedula_esposo,
            datos.fecha_nacimiento_esposo,
            datos.lugar_nacimiento_esposo,
            datos.nombre_padre_esposo,
            datos.nombre_madre_esposo,

            datos.nombres_esposa,
            datos.apellidos_esposa,
            datos.cedula_esposa,
            datos.fecha_nacimiento_esposa,
            datos.lugar_nacimiento_esposa,
            datos.nombre_padre_esposa,
            datos.nombre_madre_esposa,

            datos.testigo_1,
            datos.testigo_2,

            this.parroco.nombre,
            this.parroco.pieFirma,
            this.parroco.firmaData,
            this.parroco.firmaTipo,

            datos.parroquia_bautismo_esposo,
            datos.parroquia_bautismo_esposa,
            padrinosBoda,

            datos.anio_registro_civil,
            datos.libro_registro_civil,
            datos.folio_registro_civil,
            datos.acta_registro_civil,
            datos.observacion
          ]
        );

        idGuardado =
          Number(resultado?.lastId || resultado?.lastInsertRowId) || 0;

        if (!idGuardado) {
          const ultima = await this.iglesiaSqlite.consultar(
            'SELECT last_insert_rowid() AS id',
            []
          );

          idGuardado = Number(this.obtenerFilas(ultima)[0]?.id) || 0;
        }

        if (!idGuardado) {
          throw new Error(
            'No se pudo recuperar el número del matrimonio guardado.'
          );
        }

      } else {

        // WINDOWS / ELECTRON
        const api = (window as any).iglesia;

        if (!api?.matrimonios?.guardar) {
          throw new Error(
            'No se encuentra disponible la función para guardar matrimonios. Verifique preload.cjs.'
          );
        }

        const resultado = await api.matrimonios.guardar(datos);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message || 'No se pudo guardar el matrimonio.'
          );
        }

        idGuardado = Number(resultado.id);
      }

      this.ngZone.run(() => {
        this.matrimonioId = idGuardado;
        this.matrimonioGuardado = true;
        this.mensajeError = '';
        this.cdr.detectChanges();
      });

      await this.mostrarAlerta(
        'Registro completado',
        `El matrimonio se registró correctamente.\nNúmero de registro: ${idGuardado}`
      );

    } catch (error: any) {
      console.error('Error al guardar matrimonio:', error);

      this.mensajeError =
        error?.message || 'Ocurrió un error al guardar el matrimonio.';

    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // MOSTRAR ALERTAS
  // =====================================================

  async mostrarAlerta(
    encabezado: string,
    mensaje: string
  ): Promise<void> {
    const alerta = await this.alertController.create({
      header: encabezado,
      message: mensaje.replace(/\n/g, '<br>'),
      buttons: ['Aceptar'],
      cssClass: 'alerta-iglesia'
    });

    await alerta.present();
  }

  // =====================================================
  // LIMPIAR FORMULARIO
  // =====================================================

  nuevoRegistro(): void {
    this.matrimonio = this.crearMatrimonioVacio();

    this.matrimonioGuardado = false;
    this.matrimonioId = null;
    this.mensajeError = '';

    this.mensajeBusquedaEsposo = '';
    this.mensajeBusquedaEsposa = '';

    this.ultimaCedulaEsposo = '';
    this.ultimaCedulaEsposa = '';

    this.buscandoEsposo = false;
    this.buscandoEsposa = false;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // =====================================================
  // BUSCAR DATOS DE BAUTISMO POR CÉDULA
  // =====================================================

  private async buscarBautismoPorCedula(cedula: string): Promise<any> {
    if (this.esIOS()) {
      const consulta = await this.iglesiaSqlite.consultar(
        `SELECT * FROM bautizos
         WHERE cedula = ?
         ORDER BY id DESC
         LIMIT 1`,
        [cedula]
      );

      return this.obtenerFilas(consulta)[0] || null;
    }

    const api = (window as any).iglesia;

    if (!api?.bautizos?.buscarPorCedula) {
      throw new Error('La búsqueda de bautismos no está disponible.');
    }

    const resultado = await api.bautizos.buscarPorCedula(cedula);

    if (!resultado?.success) {
      throw new Error(
        resultado?.message || 'No se pudo consultar el registro de bautismo.'
      );
    }

    return resultado.encontrado ? resultado.bautismo : null;
  }

  // =====================================================
  // BUSCAR DATOS DEL ESPOSO POR CÉDULA
  // =====================================================

  async buscarDatosEsposo(cedula: string): Promise<void> {
    const numeroCedula = (cedula || '').trim();

    this.mensajeBusquedaEsposo = '';

    if (numeroCedula.length !== 10) {
      this.ultimaCedulaEsposo = '';
      return;
    }

    if (this.ultimaCedulaEsposo === numeroCedula) {
      return;
    }

    this.ultimaCedulaEsposo = numeroCedula;
    this.buscandoEsposo = true;

    try {
      const datos = await this.buscarBautismoPorCedula(numeroCedula);

      if (this.matrimonio.cedula_esposo !== numeroCedula) {
        return;
      }

      if (datos) {
        this.ngZone.run(() => {
          this.matrimonio.nombres_esposo =
            datos.nombres_bautizado || this.matrimonio.nombres_esposo;

          this.matrimonio.apellidos_esposo =
            datos.apellidos_bautizado || this.matrimonio.apellidos_esposo;

          this.matrimonio.fecha_nacimiento_esposo =
            datos.fecha_nacimiento || this.matrimonio.fecha_nacimiento_esposo;

          this.matrimonio.lugar_nacimiento_esposo =
            datos.lugar_nacimiento || this.matrimonio.lugar_nacimiento_esposo;

          this.matrimonio.parroquia_bautismo_esposo =
            datos.lugar_bautizo || this.matrimonio.parroquia_bautismo_esposo;

          this.matrimonio.nombre_padre_esposo =
            datos.nombre_padre || this.matrimonio.nombre_padre_esposo;

          this.matrimonio.nombre_madre_esposo =
            datos.nombre_madre || this.matrimonio.nombre_madre_esposo;

          this.mensajeBusquedaEsposo =
            'Datos encontrados. Se completó la información del esposo.';

          this.cdr.detectChanges();
        });
      } else {
        this.mensajeBusquedaEsposo =
          'No se encontraron antecedentes de bautismo. Ingrese los datos manualmente.';
      }

    } catch (error) {
      console.error('Error buscando datos del esposo:', error);

      this.mensajeBusquedaEsposo =
        'No se pudo realizar la búsqueda. Puede ingresar los datos manualmente.';

    } finally {
      this.buscandoEsposo = false;
      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // BUSCAR DATOS DE LA ESPOSA POR CÉDULA
  // =====================================================

  async buscarDatosEsposa(cedula: string): Promise<void> {
    const numeroCedula = (cedula || '').trim();

    this.mensajeBusquedaEsposa = '';

    if (numeroCedula.length !== 10) {
      this.ultimaCedulaEsposa = '';
      return;
    }

    if (this.ultimaCedulaEsposa === numeroCedula) {
      return;
    }

    this.ultimaCedulaEsposa = numeroCedula;
    this.buscandoEsposa = true;

    try {
      const datos = await this.buscarBautismoPorCedula(numeroCedula);

      if (this.matrimonio.cedula_esposa !== numeroCedula) {
        return;
      }

      if (datos) {
        this.ngZone.run(() => {
          this.matrimonio.nombres_esposa =
            datos.nombres_bautizado || this.matrimonio.nombres_esposa;

          this.matrimonio.apellidos_esposa =
            datos.apellidos_bautizado || this.matrimonio.apellidos_esposa;

          this.matrimonio.fecha_nacimiento_esposa =
            datos.fecha_nacimiento || this.matrimonio.fecha_nacimiento_esposa;

          this.matrimonio.lugar_nacimiento_esposa =
            datos.lugar_nacimiento || this.matrimonio.lugar_nacimiento_esposa;

          this.matrimonio.parroquia_bautismo_esposa =
            datos.lugar_bautizo || this.matrimonio.parroquia_bautismo_esposa;

          this.matrimonio.nombre_padre_esposa =
            datos.nombre_padre || this.matrimonio.nombre_padre_esposa;

          this.matrimonio.nombre_madre_esposa =
            datos.nombre_madre || this.matrimonio.nombre_madre_esposa;

          this.mensajeBusquedaEsposa =
            'Datos encontrados. Se completó la información de la esposa.';

          this.cdr.detectChanges();
        });
      } else {
        this.mensajeBusquedaEsposa =
          'No se encontraron antecedentes de bautismo. Ingrese los datos manualmente.';
      }

    } catch (error) {
      console.error('Error buscando datos de la esposa:', error);

      this.mensajeBusquedaEsposa =
        'No se pudo realizar la búsqueda. Puede ingresar los datos manualmente.';

    } finally {
      this.buscandoEsposa = false;
      this.cdr.detectChanges();
    }
  }

  // =====================================================
  // REGRESAR
  // =====================================================

  regresar(): void {
    this.router.navigateByUrl('/matrimonio');
  }
}