import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

import { IglesiaSqliteService } from '../../../servicios/iglesia-sqlite';

@Component({
  selector: 'app-registro-bautizos',
  templateUrl: './registro-bautizos.page.html',
  styleUrls: ['./registro-bautizos.page.scss'],
  standalone: false,
})
export class RegistroBautizosPage implements OnInit {

  cargandoParroco = true;
  guardando = false;
  mensajeError = '';
  bautizoGuardado = false;
  bautizoId: number | null = null;

  lugaresBautizo = [
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

  bautizo = this.nuevoBautizo();

  constructor(
    private alertController: AlertController,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
    private iglesiaSqlite: IglesiaSqliteService
  ) {}

  private nuevoBautizo() {
    return {
      numero_bautizo: '',
      fecha_bautizo: '',
      tomo_bautizo: '',
      pagina_bautizo: '',
      lugar_bautizo: '',
      ministro: '',
      nombres_bautizado: '',
      apellidos_bautizado: '',
      lugar_nacimiento: '',
      fecha_nacimiento: '',
      nombre_padre: '',
      nombre_madre: '',
      padrino: '',
      madrina: '',
      cedula: '',
      anio_registro: '',
      tomo_registro: '',
      pagina_registro: '',
      acta_registro: '',
      lugar_registro: '',
      nota_marginal: 'Ninguna'
    };
  }

  async ngOnInit(): Promise<void> {
    await this.cargarParrocoVigente();
  }

  // =====================================================
  // CARGAR CONFIGURACIÓN PARROQUIAL
  // =====================================================

  async cargarParrocoVigente(): Promise<void> {

    this.cargandoParroco = true;
    this.mensajeError = '';

    try {

      let datos: any;

      if (Capacitor.isNativePlatform()) {

        const registros = await this.iglesiaSqlite.consultar(
          `SELECT *
           FROM configuracion_parroquial
           WHERE id = 1
           LIMIT 1`
        );

        datos = registros[0];

      } else {

        const api = (window as any).iglesia;

        if (!api?.parroco?.obtener) {
          throw new Error(
            'No está disponible la conexión con la configuración parroquial.'
          );
        }

        datos = await api.parroco.obtener();
      }

      if (!datos) {
        throw new Error(
          'No se encontró la configuración parroquial.'
        );
      }

      this.parroco.nombre =
        datos.parroco_nombre || '';

      this.parroco.pieFirma =
        datos.pie_firma || 'Párroco';

      this.parroco.firmaData =
        datos.parroco_firma_data || '';

      this.parroco.firmaTipo =
        datos.parroco_firma_tipo || '';

      if (
        this.parroco.firmaData &&
        this.parroco.firmaTipo
      ) {
        this.parroco.firmaPreview =
          `data:${this.parroco.firmaTipo};base64,${this.parroco.firmaData}`;
      } else {
        this.parroco.firmaPreview = '';
      }

    } catch (error: any) {

      console.error(
        'Error al cargar configuración parroquial:',
        error
      );

      this.mensajeError =
        error?.message ||
        'No se pudo cargar la configuración parroquial.';

    } finally {

      this.cargandoParroco = false;
      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
  // VALIDAR FORMULARIO
  // =====================================================

  validarFormulario(): string {

    if (!this.bautizo.numero_bautizo.trim()) {
      return 'Ingresa el número de bautizo.';
    }

    if (!this.bautizo.fecha_bautizo) {
      return 'Selecciona la fecha del bautizo.';
    }

    if (!this.bautizo.lugar_bautizo) {
      return 'Selecciona el lugar donde se realizó el bautizo.';
    }

    if (!this.bautizo.ministro.trim()) {
      return 'Ingresa el nombre del ministro que realizó el bautizo.';
    }

    if (!this.bautizo.nombres_bautizado.trim()) {
      return 'Ingresa los nombres del bautizado.';
    }

    if (!this.bautizo.apellidos_bautizado.trim()) {
      return 'Ingresa los apellidos del bautizado.';
    }

    if (!this.bautizo.fecha_nacimiento) {
      return 'Selecciona la fecha de nacimiento del bautizado.';
    }

    if (
      this.bautizo.fecha_nacimiento >
      this.bautizo.fecha_bautizo
    ) {
      return 'La fecha de nacimiento no puede ser posterior a la fecha del bautizo.';
    }

    return '';
  }

  // =====================================================
  // GUARDAR BAUTIZO
  // =====================================================

  async guardarBautizo(): Promise<void> {

    if (this.guardando || this.bautizoGuardado) {
      return;
    }

    const errorValidacion = this.validarFormulario();

    if (errorValidacion) {
      await this.mostrarAlerta(
        'Revisa el formulario',
        errorValidacion
      );
      return;
    }

    this.guardando = true;
    this.mensajeError = '';

    this.changeDetector.detectChanges();

    try {

      const datos: any = {

        numero_bautizo: this.bautizo.numero_bautizo.trim(),
        fecha_bautizo: this.bautizo.fecha_bautizo,
        tomo_bautizo: this.bautizo.tomo_bautizo.trim(),
        pagina_bautizo: this.bautizo.pagina_bautizo.trim(),
        lugar_bautizo: this.bautizo.lugar_bautizo,
        ministro: this.bautizo.ministro.trim(),

        nombres_bautizado: this.bautizo.nombres_bautizado.trim(),
        apellidos_bautizado: this.bautizo.apellidos_bautizado.trim(),
        lugar_nacimiento: this.bautizo.lugar_nacimiento.trim(),
        fecha_nacimiento: this.bautizo.fecha_nacimiento,

        nombre_padre: this.bautizo.nombre_padre.trim(),
        nombre_madre: this.bautizo.nombre_madre.trim(),
        padrino: this.bautizo.padrino.trim(),
        madrina: this.bautizo.madrina.trim(),

        cedula: this.bautizo.cedula.trim(),
        anio_registro: this.bautizo.anio_registro.trim(),
        tomo_registro: this.bautizo.tomo_registro.trim(),
        pagina_registro: this.bautizo.pagina_registro.trim(),
        acta_registro: this.bautizo.acta_registro.trim(),
        lugar_registro: this.bautizo.lugar_registro.trim(),

        nota_marginal:
          this.bautizo.nota_marginal.trim() || 'Ninguna',

        parroco_nombre: this.parroco.nombre,
        pie_firma: this.parroco.pieFirma
      };

      let resultado: any;

      if (Capacitor.isNativePlatform()) {

        // Comprobar que el número no esté registrado.
        const existente = await this.iglesiaSqlite.consultar(
          `SELECT id
           FROM bautizos
           WHERE numero_bautizo = ?
           LIMIT 1`,
          [datos.numero_bautizo]
        );

        if (existente.length > 0) {
          throw new Error(
            'Ya existe un bautizo registrado con ese número.'
          );
        }

        const sql = `
          INSERT INTO bautizos (
            numero_bautizo,
            fecha_bautizo,
            tomo_bautizo,
            pagina_bautizo,
            lugar_bautizo,
            ministro,
            nombres_bautizado,
            apellidos_bautizado,
            lugar_nacimiento,
            fecha_nacimiento,
            nombre_padre,
            nombre_madre,
            padrino,
            madrina,
            cedula,
            anio_registro,
            tomo_registro,
            pagina_registro,
            acta_registro,
            lugar_registro,
            nota_marginal,
            parroco_nombre,
            pie_firma
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `;

        const valores = [
          datos.numero_bautizo,
          datos.fecha_bautizo,
          datos.tomo_bautizo,
          datos.pagina_bautizo,
          datos.lugar_bautizo,
          datos.ministro,
          datos.nombres_bautizado,
          datos.apellidos_bautizado,
          datos.lugar_nacimiento,
          datos.fecha_nacimiento,
          datos.nombre_padre,
          datos.nombre_madre,
          datos.padrino,
          datos.madrina,
          datos.cedula,
          datos.anio_registro,
          datos.tomo_registro,
          datos.pagina_registro,
          datos.acta_registro,
          datos.lugar_registro,
          datos.nota_marginal,
          datos.parroco_nombre,
          datos.pie_firma
        ];

        resultado = await this.iglesiaSqlite.ejecutarCambios(
          sql,
          valores
        );

        this.bautizoId =
          resultado?.changes?.lastId ??
          resultado?.lastId ??
          null;

      } else {

        const api = (window as any).iglesia;

        if (!api?.bautizos?.guardar) {
          throw new Error(
            'No está disponible la conexión para guardar bautizos.'
          );
        }

        resultado = await api.bautizos.guardar(datos);

        if (!resultado?.success) {
          throw new Error(
            resultado?.message ||
            'No se pudo registrar el bautizo.'
          );
        }

        this.bautizoId = Number(resultado.id);
      }

      this.bautizoGuardado = true;

      await this.mostrarAlerta(
        'Bautizo registrado',
        'El registro se guardó correctamente en la base de datos. ' +
        (this.bautizoId
          ? `Número de registro: ${this.bautizoId}.`
          : '')
      );

      this.limpiarFormulario();

    } catch (error: any) {

      console.error(
        'Error al guardar bautizo:',
        error
      );

      await this.mostrarAlerta(
        'Error al guardar',
        error?.message ||
        'Ocurrió un problema al guardar el bautizo.'
      );

    } finally {

      this.guardando = false;
      this.changeDetector.detectChanges();

    }
  }

  // =====================================================
  // LIMPIAR FORMULARIO
  // =====================================================

  limpiarFormulario(): void {

    this.bautizo = this.nuevoBautizo();

    this.bautizoGuardado = false;
    this.bautizoId = null;
    this.mensajeError = '';

    this.changeDetector.detectChanges();
  }

  // =====================================================
  // MOSTRAR ALERTAS
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

  cambiarLugarBautizo(event: any): void {

    this.bautizo.lugar_bautizo =
      event.detail.value || '';

    this.changeDetector.detectChanges();

    console.log(
      'Lugar del bautizo seleccionado:',
      this.bautizo.lugar_bautizo
    );
  }
}