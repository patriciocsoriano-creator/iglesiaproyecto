
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarParrocoVigente();
  }

  // =====================================================
  // CARGAR CONFIGURACIÓN DEL PÁRROCO
  // =====================================================

  async cargarParrocoVigente(): Promise<void> {

    this.cargandoParroco = true;
    this.mensajeError = '';

    try {

      const api = (window as any).iglesia;

      if (!api?.parroco?.obtener) {
        throw new Error(
          'No se encuentra disponible la conexión con la base de datos.'
        );
      }

      const resultado = await api.parroco.obtener();

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

    this.ngZone.run(() => {

      if (resultado.encontrado && resultado.bautismo) {

        const bautismo = resultado.bautismo;

        // DATOS PERSONALES DEL NIÑO
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

        // DATOS DE PADRINOS (si existen)
        this.comunion.padrino =
          bautismo.padrino || '';

        this.comunion.madrina =
          bautismo.madrina || '';

        this.bautismoEncontrado = true;

      } else {

        // No se encontró: permitir ingreso manual.
        this.comunion.nombres = '';
        this.comunion.apellidos = '';
        this.comunion.lugar_nacimiento = '';
        this.comunion.fecha_nacimiento = '';

        this.comunion.nombre_padre = '';
        this.comunion.nombre_madre = '';

        this.comunion.parroquia_bautismo = '';
        this.comunion.fecha_bautismo = '';

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

      const api = (window as any).iglesia;

      if (!api?.comuniones?.guardar) {
        throw new Error(
          'No se encuentra disponible la función para guardar Primera Comunión.'
        );
      }

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

      const resultado = await api.comuniones.guardar(datos);

      if (!resultado?.success) {
        throw new Error(
          resultado?.message ||
          'No se pudo guardar la Primera Comunión.'
        );
      }

      this.ngZone.run(() => {

        this.comunionId = resultado.id;
        this.comunionGuardada = true;

        this.mensajeError = '';

        this.cdr.detectChanges();

      });

      await this.mostrarAlerta(
        'Registro completado',
        `La Primera Comunión se registró correctamente.\nNúmero de registro: ${resultado.id}`
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
