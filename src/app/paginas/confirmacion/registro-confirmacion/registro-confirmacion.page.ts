import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

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
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.cargarParrocoVigente();
  }

  // ==========================================
  // CARGAR PÁRROCO Y FIRMA VIGENTE
  // ==========================================

  async cargarParrocoVigente(): Promise<void> {
    this.cargandoParroco = true;
    this.mensajeError = '';

    try {
      const resultado = await (window as any).iglesia.parroco.obtener();

      this.zone.run(() => {
        if (resultado) {
          this.parroco.nombre = resultado.parroco_nombre || '';
          this.parroco.pieFirma = resultado.pie_firma || 'Párroco';
          this.parroco.firmaData = resultado.parroco_firma_data || '';
          this.parroco.firmaTipo = resultado.parroco_firma_tipo || '';

          this.actualizarVistaFirma();
        } else {
          this.mensajeError = 'No se encontró la configuración del párroco.';
        }

        this.cargandoParroco = false;
        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error al cargar el párroco:', error);

      this.zone.run(() => {
        this.mensajeError = 'No fue posible cargar los datos del párroco.';
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

    if (this.parroco.firmaData.startsWith('data:image')) {
      this.parroco.firmaPreview = this.parroco.firmaData;
    } else {
      const tipo = this.parroco.firmaTipo || 'png';

      this.parroco.firmaPreview =
        `data:image/${tipo};base64,${this.parroco.firmaData}`;
    }
  }

  // ==========================================
  // BUSCAR ANTECEDENTES SACRAMENTALES
  // ==========================================

  async buscarAntecedentesConfirmacion(): Promise<void> {
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
      const resultado = await (window as any).iglesia.confirmaciones.buscarAntecedentes(cedula);

      this.zone.run(async () => {
        if (!resultado || !resultado.success) {
          this.bautismoEncontrado = false;
          this.comunionEncontrada = false;

          await this.mostrarAlerta(
            'Consulta realizada',
            resultado?.message || 'No fue posible consultar los antecedentes sacramentales.'
          );

          this.buscandoAntecedentes = false;
          this.cdr.detectChanges();
          return;
        }

        this.bautismoEncontrado = !!resultado.bautismoEncontrado;
        this.comunionEncontrada = !!resultado.comunionEncontrada;

        const datos = resultado.datos || {};

        // Completar únicamente los datos personales encontrados.
        // Los padrinos de Confirmación siempre se ingresan manualmente.

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

        // No recuperar padrino ni madrina de otros sacramentos.
        this.confirmacion.nombre_padrino = '';
        this.confirmacion.nombre_madrina = '';

        this.buscandoAntecedentes = false;
        this.cdr.detectChanges();

        if (this.bautismoEncontrado || this.comunionEncontrada) {
          let mensaje = 'Se encontraron antecedentes sacramentales.';

          if (this.bautismoEncontrado && this.comunionEncontrada) {
            mensaje = 'Se encontraron registros de Bautismo y Primera Comunión.';
          } else if (this.bautismoEncontrado) {
            mensaje = 'Se encontró un registro de Bautismo. Los demás datos deberán completarse si es necesario.';
          } else {
            mensaje = 'Se encontró un registro de Primera Comunión. Los demás datos deberán completarse si es necesario.';
          }

          await this.mostrarAlerta('Antecedentes encontrados', mensaje);

        } else {
          await this.mostrarAlerta(
            'Sin antecedentes locales',
            'No se encontró un registro local de Bautismo ni de Primera Comunión para esta cédula. Esto no significa que la persona no haya recibido estos sacramentos. Puede continuar y completar los datos manualmente.'
          );
        }

        this.cdr.detectChanges();
      });

    } catch (error) {
      console.error('Error al buscar antecedentes:', error);

      this.zone.run(() => {
        this.buscandoAntecedentes = false;
        this.bautismoEncontrado = false;
        this.comunionEncontrada = false;
        this.cdr.detectChanges();
      });

      await this.mostrarAlerta(
        'Error de consulta',
        'Ocurrió un problema al consultar los registros sacramentales.'
      );
    }
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
      this.mensajeError = 'La fecha de nacimiento no puede ser posterior a la Confirmación.';
      return false;
    }

    if (c.fecha_bautismo) {
      const fechaBautismo = new Date(c.fecha_bautismo + 'T00:00:00');

      if (fechaBautismo < fechaNacimiento) {
        this.mensajeError = 'La fecha del Bautismo no puede ser anterior al nacimiento.';
        return false;
      }

      if (fechaBautismo > fechaConfirmacion) {
        this.mensajeError = 'La fecha del Bautismo no puede ser posterior a la Confirmación.';
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

    const c = this.confirmacion;

    const datos = {
      numero_confirmacion: c.numero_confirmacion.trim(),
      fecha_confirmacion: c.fecha_confirmacion,
      tomo_confirmacion: c.tomo_confirmacion.trim(),
      pagina_confirmacion: c.pagina_confirmacion.trim(),
      lugar_confirmacion: c.lugar_confirmacion,
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

      // Copia histórica de la configuración parroquial vigente.
      parroco_nombre: this.parroco.nombre,
      pie_firma: this.parroco.pieFirma,
      parroco_firma_data: this.parroco.firmaData,
      parroco_firma_tipo: this.parroco.firmaTipo
    };

    this.guardando = true;

    try {
      const resultado = await (window as any).iglesia.confirmaciones.guardar(datos);

      this.zone.run(async () => {
        if (resultado && resultado.success) {
          this.confirmacionId = resultado.id || resultado.insertId || null;
          this.confirmacionGuardada = true;

          await this.mostrarAlerta(
            'Registro exitoso',
            'La Confirmación se ha registrado correctamente.'
          );
        } else {
          await this.mostrarAlerta(
            'No se pudo guardar',
            resultado?.message || 'No fue posible guardar el registro de Confirmación.'
          );
        }

        this.guardando = false;
        this.cdr.detectChanges();
      });

    } catch (error: any) {
      console.error('Error al guardar Confirmación:', error);

      this.zone.run(() => {
        this.guardando = false;
        this.cdr.detectChanges();
      });

      await this.mostrarAlerta(
        'Error al guardar',
        error?.message || 'Ocurrió un problema al guardar el registro.'
      );
    }
  }

  // ==========================================
  // ALERTAS
  // ==========================================

  async mostrarAlerta(encabezado: string, mensaje: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: encabezado,
      message: mensaje,
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