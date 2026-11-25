import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IglesiaSqliteService } from '../../../servicios/iglesia-sqlite';

@Component({
  selector: 'app-registro-confirmacion',
  templateUrl: './registro-confirmacion.page.html',
  styleUrls: ['./registro-confirmacion.page.scss'],
  standalone: false,
})
export class RegistroConfirmacionPage implements OnInit {

  cargandoParroco = true;
  guardando = false;
  buscandoAntecedentes = false;

  mensajeError = '';

  bautismoEncontrado: boolean | null = null;
  comunionEncontrada: boolean | null = null;

  confirmacionGuardada = false;
  confirmacionId: number | null = null;

  lugaresConfirmacion: string[] = [
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

  confirmacion = {
    numero_confirmacion: '',
    fecha_confirmacion: '',
    tomo_confirmacion: '',
    pagina_confirmacion: '',
    lugar_confirmacion: '',
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
    nombre_padrino: '',
    nombre_madrina: ''
  };

  constructor(
    private alertController: AlertController,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
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

  // ==========================================
  // CARGAR PÁRROCO Y FIRMA VIGENTE
  // ==========================================

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
          throw new Error('No se encuentra disponible la conexión con la base de datos.');
        }

        resultado = await api.parroco.obtener();
      }

      if (!resultado) {
        throw new Error('No se encontró la configuración del párroco.');
      }

      this.zone.run(() => {
        this.parroco.nombre = resultado.parroco_nombre || '';
        this.parroco.pieFirma = resultado.pie_firma || 'Párroco';
        this.parroco.firmaData = resultado.parroco_firma_data || '';
        this.parroco.firmaTipo = resultado.parroco_firma_tipo || '';

        this.actualizarVistaFirma();
        this.cargandoParroco = false;
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      console.error('Error al cargar el párroco:', error);

      this.zone.run(() => {
        this.mensajeError =
          error?.message || 'No fue posible cargar los datos del párroco.';

        this.cargandoParroco = false;
        this.cdr.detectChanges();
      });
    }
  }

  actualizarVistaFirma(): void {
    if (!this.parroco.firmaData) {
      this.parroco.firmaPreview = '';
      return;
    }

    this.parroco.firmaPreview =
      this.parroco.firmaData.startsWith('data:image')
        ? this.parroco.firmaData
        : `data:${this.parroco.firmaTipo || 'image/png'};base64,${this.parroco.firmaData}`;
  }

  // ==========================================
  // BUSCAR ANTECEDENTES SACRAMENTALES
  // ==========================================

  async buscarAntecedentesConfirmacion(): Promise<void> {
    if (this.buscandoAntecedentes) {
      return;
    }

    const cedula = this.confirmacion.cedula.trim();

    if (!cedula) {
      await this.mostrarAlerta(
        'Cédula requerida',
        'Ingrese el número de cédula para consultar los antecedentes sacramentales.'
      );
      return;
    }

    if (cedula.length > 20) {
      await this.mostrarAlerta(
        'Cédula no válida',
        'Verifique el número de cédula ingresado.'
      );
      return;
    }

    this.buscandoAntecedentes = true;
    this.bautismoEncontrado = null;
    this.comunionEncontrada = null;

    try {
      let bautismo: any = null;
      let comunion: any = null;

      if (this.esIOS()) {
        const consultaBautismo = await this.iglesiaSqlite.consultar(
          `SELECT * FROM bautizos
           WHERE cedula = ?
           ORDER BY id DESC LIMIT 1`,
          [cedula]
        );

        const consultaComunion = await this.iglesiaSqlite.consultar(
          `SELECT * FROM comuniones
           WHERE cedula = ?
           ORDER BY id DESC LIMIT 1`,
          [cedula]
        );

        bautismo = this.obtenerFilas(consultaBautismo)[0] || null;
        comunion = this.obtenerFilas(consultaComunion)[0] || null;

      } else {
        const api = (window as any).iglesia;

        if (!api?.confirmaciones?.buscarAntecedentes) {
          throw new Error('La búsqueda de antecedentes no está disponible en Windows.');
        }

        const resultado =
          await api.confirmaciones.buscarAntecedentes(cedula);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message || 'No fue posible consultar los antecedentes.'
          );
        }

        this.bautismoEncontrado = !!resultado.bautismoEncontrado;
        this.comunionEncontrada = !!resultado.comunionEncontrada;

        const datos = resultado.datos || {};

        this.zone.run(() => {
          this.completarDatosPersonales(datos);
          this.cdr.detectChanges();
        });

        this.buscandoAntecedentes = false;

        if (this.bautismoEncontrado || this.comunionEncontrada) {
          await this.mostrarAlerta(
            'Antecedentes encontrados',
            'Se encontraron antecedentes sacramentales. Revise los datos completados.'
          );
        } else {
          await this.mostrarAlerta(
            'Sin antecedentes locales',
            'No se encontraron registros locales de Bautismo ni de Primera Comunión para esta cédula. Esto no significa que la persona no haya recibido estos sacramentos. Puede completar los datos manualmente.'
          );
        }

        return;
      }

      this.bautismoEncontrado = !!bautismo;
      this.comunionEncontrada = !!comunion;

      // Se priorizan los datos del bautismo.
      // Si no existe, se utilizan los datos de la comunión.
      const fuente = bautismo || comunion;

      if (fuente) {
        const datos = bautismo
          ? {
              nombres: bautismo.nombres_bautizado,
              apellidos: bautismo.apellidos_bautizado,
              lugar_nacimiento: bautismo.lugar_nacimiento,
              fecha_nacimiento: bautismo.fecha_nacimiento,
              parroquia_bautismo: bautismo.lugar_bautizo,
              fecha_bautismo: bautismo.fecha_bautizo,
              nombre_padre: bautismo.nombre_padre,
              nombre_madre: bautismo.nombre_madre
            }
          : {
              nombres: comunion.nombres,
              apellidos: comunion.apellidos,
              lugar_nacimiento: comunion.lugar_nacimiento,
              fecha_nacimiento: comunion.fecha_nacimiento,
              parroquia_bautismo: comunion.parroquia_bautismo,
              fecha_bautismo: comunion.fecha_bautismo,
              nombre_padre: comunion.nombre_padre,
              nombre_madre: comunion.nombre_madre
            };

        this.zone.run(() => {
          this.completarDatosPersonales(datos);
          this.cdr.detectChanges();
        });
      }

      // Los padrinos de Confirmación siempre se ingresan manualmente.
      this.confirmacion.nombre_padrino = '';
      this.confirmacion.nombre_madrina = '';

      if (this.bautismoEncontrado || this.comunionEncontrada) {
        let mensaje = 'Se encontraron antecedentes sacramentales.';

        if (this.bautismoEncontrado && this.comunionEncontrada) {
          mensaje = 'Se encontraron registros de Bautismo y Primera Comunión.';
        } else if (this.bautismoEncontrado) {
          mensaje = 'Se encontró un registro de Bautismo.';
        } else {
          mensaje = 'Se encontró un registro de Primera Comunión.';
        }

        await this.mostrarAlerta('Antecedentes encontrados', mensaje);
      } else {
        await this.mostrarAlerta(
          'Sin antecedentes locales',
          'No se encontraron registros locales de Bautismo ni de Primera Comunión para esta cédula. Esto no significa que la persona no haya recibido estos sacramentos. Puede continuar y completar los datos manualmente.'
        );
      }

    } catch (error: any) {
      console.error('Error al buscar antecedentes:', error);

      this.bautismoEncontrado = false;
      this.comunionEncontrada = false;

      await this.mostrarAlerta(
        'Error de consulta',
        error?.message || 'Ocurrió un problema al consultar los registros sacramentales.'
      );

    } finally {
      this.buscandoAntecedentes = false;
      this.cdr.detectChanges();
    }
  }

  private completarDatosPersonales(datos: any): void {
    this.confirmacion.nombres =
      datos.nombres || this.confirmacion.nombres;

    this.confirmacion.apellidos =
      datos.apellidos || this.confirmacion.apellidos;

    this.confirmacion.lugar_nacimiento =
      datos.lugar_nacimiento || this.confirmacion.lugar_nacimiento;

    this.confirmacion.fecha_nacimiento =
      datos.fecha_nacimiento || this.confirmacion.fecha_nacimiento;

    this.confirmacion.parroquia_bautismo =
      datos.parroquia_bautismo || this.confirmacion.parroquia_bautismo;

    this.confirmacion.fecha_bautismo =
      datos.fecha_bautismo || this.confirmacion.fecha_bautismo;

    this.confirmacion.nombre_padre =
      datos.nombre_padre || this.confirmacion.nombre_padre;

    this.confirmacion.nombre_madre =
      datos.nombre_madre || this.confirmacion.nombre_madre;
  }

  // ==========================================
  // VALIDAR FORMULARIO
  // ==========================================

  validarFormulario(): boolean {
    const c = this.confirmacion;

    if (!c.numero_confirmacion.trim()) {
      this.mensajeError = 'Ingrese el número de Confirmación.';
      return false;
    }

    if (!c.fecha_confirmacion) {
      this.mensajeError = 'Seleccione la fecha de Confirmación.';
      return false;
    }

    if (!c.lugar_confirmacion) {
      this.mensajeError = 'Seleccione el lugar de Confirmación.';
      return false;
    }

    if (!c.ministro.trim()) {
      this.mensajeError = 'Ingrese el nombre del ministro.';
      return false;
    }

    if (!c.cedula.trim()) {
      this.mensajeError = 'Ingrese el número de cédula.';
      return false;
    }

    if (!c.nombres.trim()) {
      this.mensajeError = 'Ingrese los nombres del confirmado.';
      return false;
    }

    if (!c.apellidos.trim()) {
      this.mensajeError = 'Ingrese los apellidos del confirmado.';
      return false;
    }

    if (!c.lugar_nacimiento.trim()) {
      this.mensajeError = 'Ingrese el lugar de nacimiento.';
      return false;
    }

    if (!c.fecha_nacimiento) {
      this.mensajeError = 'Seleccione la fecha de nacimiento.';
      return false;
    }

    if (!c.nombre_padrino.trim()) {
      this.mensajeError = 'Ingrese el nombre del padrino de Confirmación.';
      return false;
    }

    if (!c.nombre_madrina.trim()) {
      this.mensajeError = 'Ingrese el nombre de la madrina de Confirmación.';
      return false;
    }

    if (!this.parroco.nombre.trim()) {
      this.mensajeError = 'No se encuentra configurado el párroco vigente.';
      return false;
    }

    const fechaConfirmacion = new Date(c.fecha_confirmacion + 'T00:00:00');
    const fechaNacimiento = new Date(c.fecha_nacimiento + 'T00:00:00');

    if (fechaNacimiento > fechaConfirmacion) {
      this.mensajeError =
        'La fecha de nacimiento no puede ser posterior a la Confirmación.';
      return false;
    }

    if (c.fecha_bautismo) {
      const fechaBautismo = new Date(c.fecha_bautismo + 'T00:00:00');

      if (fechaBautismo < fechaNacimiento) {
        this.mensajeError =
          'La fecha del Bautismo no puede ser anterior al nacimiento.';
        return false;
      }

      if (fechaBautismo > fechaConfirmacion) {
        this.mensajeError =
          'La fecha del Bautismo no puede ser posterior a la Confirmación.';
        return false;
      }
    }

    this.mensajeError = '';
    return true;
  }

  // ==========================================
  // GUARDAR CONFIRMACIÓN
  // ==========================================

  async guardarConfirmacion(): Promise<void> {
    if (this.guardando) {
      return;
    }

    if (!this.validarFormulario()) {
      await this.mostrarAlerta('Verifique los datos', this.mensajeError);
      return;
    }

    this.guardando = true;
    this.confirmacionGuardada = false;
    this.confirmacionId = null;

    const c = this.confirmacion;

    const datos = {
      numero_confirmacion: c.numero_confirmacion.trim(),
      fecha_confirmacion: c.fecha_confirmacion,
      tomo_confirmacion: c.tomo_confirmacion.trim(),
      pagina_confirmacion: c.pagina_confirmacion.trim(),
      lugar_confirmacion: c.lugar_confirmacion.trim(),
      ministro: c.ministro.trim(),
      cedula: c.cedula.trim(),
      nombres: c.nombres.trim(),
      apellidos: c.apellidos.trim(),
      lugar_nacimiento: c.lugar_nacimiento.trim(),
      fecha_nacimiento: c.fecha_nacimiento,
      parroquia_bautismo: c.parroquia_bautismo.trim(),
      fecha_bautismo: c.fecha_bautismo || null,
      nombre_padre: c.nombre_padre.trim(),
      nombre_madre: c.nombre_madre.trim(),
      nombre_padrino: c.nombre_padrino.trim(),
      nombre_madrina: c.nombre_madrina.trim(),
      parroco_nombre: this.parroco.nombre,
      pie_firma: this.parroco.pieFirma,
      parroco_firma_data: this.parroco.firmaData,
      parroco_firma_tipo: this.parroco.firmaTipo
    };

    try {
      let idGuardado: number;

      if (this.esIOS()) {
        const duplicado = await this.iglesiaSqlite.consultar(
          `SELECT id FROM confirmaciones
           WHERE numero_confirmacion = ?
           LIMIT 1`,
          [datos.numero_confirmacion]
        );

        if (this.obtenerFilas(duplicado).length > 0) {
          throw new Error(
            'Ya existe una Confirmación registrada con ese número.'
          );
        }

        const resultado: any = await this.iglesiaSqlite.ejecutarCambios(
          `INSERT INTO confirmaciones (
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
            parroco_firma_tipo,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            datetime('now','localtime'),
            datetime('now','localtime')
          )`,
          [
            datos.numero_confirmacion,
            datos.fecha_confirmacion,
            datos.tomo_confirmacion,
            datos.pagina_confirmacion,
            datos.lugar_confirmacion,
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
            datos.nombre_padrino,
            datos.nombre_madrina,
            datos.parroco_nombre,
            datos.pie_firma,
            datos.parroco_firma_data,
            datos.parroco_firma_tipo
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
          throw new Error('No se pudo recuperar el número del registro guardado.');
        }

      } else {
        const api = (window as any).iglesia;

        if (!api?.confirmaciones?.guardar) {
          throw new Error('No está disponible la función para guardar Confirmaciones.');
        }

        const resultado = await api.confirmaciones.guardar(datos);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message || 'No fue posible guardar el registro de Confirmación.'
          );
        }

        idGuardado = Number(resultado.id || resultado.insertId);
      }

      this.zone.run(() => {
        this.confirmacionId = idGuardado;
        this.confirmacionGuardada = true;
        this.mensajeError = '';
        this.cdr.detectChanges();
      });

      await this.mostrarAlerta(
        'Registro exitoso',
        `La Confirmación se ha registrado correctamente.\nNúmero de registro: ${idGuardado}`
      );

    } catch (error: any) {
      console.error('Error al guardar Confirmación:', error);

      this.mensajeError =
        error?.message || 'Ocurrió un problema al guardar el registro.';

      await this.mostrarAlerta('Error al guardar', this.mensajeError);

    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // ALERTAS
  // ==========================================

  async mostrarAlerta(encabezado: string, mensaje: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: encabezado,
      message: mensaje.replace(/\n/g, '<br>'),
      buttons: ['Aceptar'],
      cssClass: 'alerta-iglesia'
    });

    await alerta.present();
  }

  // ==========================================
  // NAVEGACIÓN
  // ==========================================

  regresar(): void {
    this.router.navigate(['/confirmacion']);
  }

  nuevoRegistro(): void {
    this.confirmacion = {
      numero_confirmacion: '',
      fecha_confirmacion: '',
      tomo_confirmacion: '',
      pagina_confirmacion: '',
      lugar_confirmacion: '',
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
      nombre_padrino: '',
      nombre_madrina: ''
    };

    this.bautismoEncontrado = null;
    this.comunionEncontrada = null;
    this.confirmacionGuardada = false;
    this.confirmacionId = null;
    this.mensajeError = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}