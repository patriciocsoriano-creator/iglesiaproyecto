import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IglesiaSqliteService } from '../../../servicios/iglesia-sqlite';

@Component({
  selector: 'app-inscripcion-comunion',
  templateUrl: './inscripcion-comunion.page.html',
  styleUrls: ['./inscripcion-comunion.page.scss'],
  standalone: false
})
export class InscripcionComunionPage implements OnInit {

  cargandoParroco = true;
  guardando = false;
  buscandoBautismo = false;

  mensajeError = '';

  bautismoEncontrado: boolean | null = null;

  comunionGuardada = false;
  comunionId: number | null = null;

  lugaresComunion: string[] = [
    'San Rafael Arcángel de Muey',
    'Capilla Virgen del Cisne',
    'Capilla Santa Ana',
    'Capilla Divina Misericordia'
  ];

  parroco = {
    nombre: '',
    pieFirma: 'Párroco',
    firmaData: '',
    firmaTipo: '',
    firmaPreview: ''
  };

  comunion = {
    numero_comunion: '',
    fecha_comunion: '',
    tomo_comunion: '',
    pagina_comunion: '',
    lugar_comunion: '',
    ministro: '',

    cedula: '',
    nombres: '',
    apellidos: '',
    lugar_nacimiento: '',
    fecha_nacimiento: '',

    parroquia_bautismo: '',
    fecha_bautismo: '',

    nombre_padre: '',
    nombre_madre: '',
    padrino: '',
    madrina: ''
  };

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

  // =====================================================
  // IDENTIFICAR PLATAFORMA
  // =====================================================

  private esIOS(): boolean {
    return Capacitor.isNativePlatform();
  }

  // =====================================================
  // NORMALIZAR RESULTADOS SQLITE
  // =====================================================

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
        throw new Error(
          'No se pudo obtener la configuración parroquial.'
        );
      }

      this.parroco.nombre =
        resultado.parroco_nombre || '';

      this.parroco.pieFirma =
        resultado.pie_firma || 'Párroco';

      this.parroco.firmaData =
        resultado.parroco_firma_data || '';

      this.parroco.firmaTipo =
        resultado.parroco_firma_tipo || '';

      this.actualizarVistaFirma();

    } catch (error: any) {

      console.error(
        'Error al cargar el párroco:',
        error
      );

      this.mensajeError =
        error?.message ||
        'Ocurrió un error al cargar los datos del párroco.';

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
  // BUSCAR BAUTISMO POR CÉDULA
  // =====================================================

  async buscarBautismo(): Promise<void> {

    if (this.buscandoBautismo) {
      return;
    }

    const cedula = this.comunion.cedula.trim();

    if (!cedula) {
      await this.mostrarAlerta(
        'Cédula requerida',
        'Ingrese el número de cédula para buscar el registro de bautismo.'
      );
      return;
    }

    this.buscandoBautismo = true;
    this.mensajeError = '';
    this.bautismoEncontrado = null;

    try {

      let bautismo: any = null;

      if (this.esIOS()) {

        const consulta = await this.iglesiaSqlite.consultar(
          `SELECT *
           FROM bautizos
           WHERE cedula = ?
           ORDER BY id DESC
           LIMIT 1`,
          [cedula]
        );

        bautismo = this.obtenerFilas(consulta)[0] || null;

      } else {

        const api = (window as any).iglesia;

        if (!api?.bautizos?.buscarPorCedula) {
          throw new Error(
            'La búsqueda de bautismos no está disponible. Verifique preload.cjs.'
          );
        }

        const resultado = await api.bautizos.buscarPorCedula(cedula);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message || 'No se pudo realizar la búsqueda.'
          );
        }

        if (resultado.encontrado && resultado.bautismo) {
          bautismo = resultado.bautismo;
        }
      }

      this.ngZone.run(() => {

        if (bautismo) {

          // DATOS PERSONALES
          this.comunion.nombres =
            bautismo.nombres_bautizado || '';

          this.comunion.apellidos =
            bautismo.apellidos_bautizado || '';

          this.comunion.lugar_nacimiento =
            bautismo.lugar_nacimiento || '';

          this.comunion.fecha_nacimiento =
            bautismo.fecha_nacimiento || '';

          // DATOS DE LOS PADRES
          this.comunion.nombre_padre =
            bautismo.nombre_padre || '';

          this.comunion.nombre_madre =
            bautismo.nombre_madre || '';

          // DATOS DEL BAUTISMO
          this.comunion.parroquia_bautismo =
            bautismo.lugar_bautizo || '';

          this.comunion.fecha_bautismo =
            bautismo.fecha_bautizo || '';

          // DATOS DE PADRINOS
          this.comunion.padrino =
            bautismo.padrino || '';

          this.comunion.madrina =
            bautismo.madrina || '';

          this.bautismoEncontrado = true;

        } else {

          // PERMITIR INGRESO MANUAL
          this.comunion.nombres = '';
          this.comunion.apellidos = '';
          this.comunion.lugar_nacimiento = '';
          this.comunion.fecha_nacimiento = '';

          this.comunion.nombre_padre = '';
          this.comunion.nombre_madre = '';

          this.comunion.parroquia_bautismo = '';
          this.comunion.fecha_bautismo = '';

          this.comunion.padrino = '';
          this.comunion.madrina = '';

          this.bautismoEncontrado = false;

        }

        this.cdr.detectChanges();

      });

    } catch (error: any) {

      console.error(
        'Error al buscar bautismo:',
        error
      );

      this.mensajeError =
        error?.message ||
        'Ocurrió un error al consultar el registro de bautismo.';

    } finally {

      this.buscandoBautismo = false;
      this.cdr.detectChanges();

    }
  }

  // =====================================================
  // VALIDAR FORMULARIO
  // =====================================================

  validarFormulario(): boolean {

    const obligatorios: { campo: string; valor: string }[] = [
      {
        campo: 'Número de comunión',
        valor: this.comunion.numero_comunion
      },
      {
        campo: 'Fecha de comunión',
        valor: this.comunion.fecha_comunion
      },
      {
        campo: 'Lugar de celebración',
        valor: this.comunion.lugar_comunion
      },
      {
        campo: 'Ministro',
        valor: this.comunion.ministro
      },
      {
        campo: 'Nombres',
        valor: this.comunion.nombres
      },
      {
        campo: 'Apellidos',
        valor: this.comunion.apellidos
      },
      {
        campo: 'Fecha de nacimiento',
        valor: this.comunion.fecha_nacimiento
      },
      {
        campo: 'Parroquia de bautismo',
        valor: this.comunion.parroquia_bautismo
      },
      {
        campo: 'Fecha de bautismo',
        valor: this.comunion.fecha_bautismo
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

    if (
      this.comunion.fecha_nacimiento >
      this.comunion.fecha_comunion
    ) {

      this.mensajeError =
        'La fecha de nacimiento no puede ser posterior a la fecha de Primera Comunión.';

      return false;

    }

    if (
      this.comunion.fecha_bautismo >
      this.comunion.fecha_comunion
    ) {

      this.mensajeError =
        'La fecha de bautismo no puede ser posterior a la fecha de Primera Comunión.';

      return false;

    }

    if (
      this.comunion.fecha_bautismo <
      this.comunion.fecha_nacimiento
    ) {

      this.mensajeError =
        'La fecha de bautismo no puede ser anterior a la fecha de nacimiento.';

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
  // GUARDAR PRIMERA COMUNIÓN
  // =====================================================

  async guardarComunion(): Promise<void> {

    if (this.guardando) {
      return;
    }

    this.mensajeError = '';
    this.comunionGuardada = false;
    this.comunionId = null;

    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;

    try {

      const datos = {

        numero_comunion:
          this.comunion.numero_comunion.trim(),

        fecha_comunion:
          this.comunion.fecha_comunion,

        tomo_comunion:
          this.comunion.tomo_comunion.trim(),

        pagina_comunion:
          this.comunion.pagina_comunion.trim(),

        lugar_comunion:
          this.comunion.lugar_comunion.trim(),

        ministro:
          this.comunion.ministro.trim(),

        cedula:
          this.comunion.cedula.trim(),

        nombres:
          this.comunion.nombres.trim(),

        apellidos:
          this.comunion.apellidos.trim(),

        lugar_nacimiento:
          this.comunion.lugar_nacimiento.trim(),

        fecha_nacimiento:
          this.comunion.fecha_nacimiento,

        parroquia_bautismo:
          this.comunion.parroquia_bautismo.trim(),

        fecha_bautismo:
          this.comunion.fecha_bautismo,

        nombre_padre:
          this.comunion.nombre_padre.trim(),

        nombre_madre:
          this.comunion.nombre_madre.trim(),

        padrino:
          this.comunion.padrino.trim(),

        madrina:
          this.comunion.madrina.trim()

      };

      let idGuardado: number;

      if (this.esIOS()) {

        // VERIFICAR NÚMERO DUPLICADO
        const duplicado = await this.iglesiaSqlite.consultar(
          `SELECT id
           FROM comuniones
           WHERE numero_comunion = ?
           LIMIT 1`,
          [datos.numero_comunion]
        );

        if (this.obtenerFilas(duplicado).length > 0) {
          throw new Error(
            'Ya existe una Primera Comunión registrada con ese número.'
          );
        }

        // INSERTAR DIRECTAMENTE EN SQLITE
        const resultado: any = await this.iglesiaSqlite.ejecutarCambios(
          `INSERT INTO comuniones (
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
            parroco_firma_tipo,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, datetime('now','localtime'),
            datetime('now','localtime')
          )`,
          [
            datos.numero_comunion,
            datos.fecha_comunion,
            datos.tomo_comunion,
            datos.pagina_comunion,
            datos.lugar_comunion,
            datos.ministro,
            datos.cedula,
            datos.nombres,
            datos.apellidos,
            datos.lugar_nacimiento,
            datos.fecha_nacimiento,
            datos.parroquia_bautismo,
            datos.fecha_bautismo,
            datos.nombre_padre,
            datos.nombre_madre,
            datos.padrino,
            datos.madrina,
            this.parroco.nombre,
            this.parroco.pieFirma,
            this.parroco.firmaData,
            this.parroco.firmaTipo
          ]
        );

        idGuardado =
          resultado?.lastId ||
          resultado?.lastInsertRowId ||
          resultado?.changes?.lastId ||
          0;

        if (!idGuardado) {

          const ultimaConsulta = await this.iglesiaSqlite.consultar(
            'SELECT last_insert_rowid() AS id',
            []
          );

          idGuardado =
            Number(this.obtenerFilas(ultimaConsulta)[0]?.id) || 0;
        }

        if (!idGuardado) {
          throw new Error(
            'La comunión se guardó, pero no se pudo recuperar su número de registro.'
          );
        }

      } else {

        // WINDOWS / ELECTRON
        const api = (window as any).iglesia;

        if (!api?.comuniones?.guardar) {
          throw new Error(
            'No se encuentra disponible la función para guardar Primera Comunión.'
          );
        }

        const resultado = await api.comuniones.guardar(datos);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message ||
            'No se pudo guardar la Primera Comunión.'
          );
        }

        idGuardado = Number(resultado.id);
      }

      this.ngZone.run(() => {

        this.comunionId = idGuardado;
        this.comunionGuardada = true;
        this.mensajeError = '';

        this.cdr.detectChanges();

      });

      await this.mostrarAlerta(
        'Registro completado',
        `La Primera Comunión se registró correctamente.\nNúmero de registro: ${idGuardado}`
      );

    } catch (error: any) {

      console.error(
        'Error al guardar Primera Comunión:',
        error
      );

      this.mensajeError =
        error?.message ||
        'Ocurrió un error al guardar la Primera Comunión.';

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
  // REGRESAR
  // =====================================================

  regresar(): void {
    this.router.navigateByUrl('/comunion');
  }

}