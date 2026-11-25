import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { IglesiaSqliteService } from '../../servicios/iglesia-sqlite';

type TipoImagen = 'firma' | 'diocesis' | 'parroquia' | 'sello';

@Component({
  selector: 'app-mantenimiento',
  templateUrl: './mantenimiento.page.html',
  styleUrls: ['./mantenimiento.page.scss'],
  standalone: false,
})
export class MantenimientoPage implements OnInit {

  cargando = false;
  guardando = false;
  importando = false;
  mensaje = '';

  firmaPreview = '';

  parroco = {
    nombre: '',
    pieFirma: 'Párroco',
    firmaData: '',
    firmaTipo: '',

    diocesisNombre: 'Diócesis de Santa Elena',
    vicariaNombre: 'Vicaría San José',
    parroquiaNombre: '',

    logoDiocesisData: '',
    logoDiocesisTipo: '',
    logoParroquiaData: '',
    logoParroquiaTipo: '',

    selloParroquiaData: '',
    selloParroquiaTipo: ''
  };

  private readonly MAX_SIZE = 2 * 1024 * 1024;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private sqlite: IglesiaSqliteService
  ) {}

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  // =====================================================
  // COMPROBAR SI ES DISPOSITIVO MÓVIL
  // =====================================================

  get esMovil(): boolean {
    return this.sqlite.esDispositivoMovil();
  }

  // =====================================================
  // CARGAR CONFIGURACIÓN
  // =====================================================

  async cargarConfiguracion(): Promise<void> {

    this.cargando = true;
    this.mensaje = '';

    try {

      let resultado: any;

      if (this.esMovil) {

        const registros = await this.sqlite.consultar(
          'SELECT * FROM configuracion_parroquial WHERE id = 1'
        );

        resultado = registros[0];

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

      this.parroco.nombre = resultado.parroco_nombre || '';
      this.parroco.pieFirma = resultado.pie_firma || 'Párroco';
      this.parroco.firmaData = resultado.parroco_firma_data || '';
      this.parroco.firmaTipo = resultado.parroco_firma_tipo || '';

      this.parroco.diocesisNombre =
        resultado.diocesis_nombre || 'Diócesis de Santa Elena';

      this.parroco.vicariaNombre =
        resultado.vicaria_nombre || 'Vicaría San José';

      this.parroco.parroquiaNombre =
        resultado.parroquia_nombre || '';

      this.parroco.logoDiocesisData =
        resultado.logo_diocesis_data || '';

      this.parroco.logoDiocesisTipo =
        resultado.logo_diocesis_tipo || '';

      this.parroco.logoParroquiaData =
        resultado.logo_parroquia_data || '';

      this.parroco.logoParroquiaTipo =
        resultado.logo_parroquia_tipo || '';

      this.parroco.selloParroquiaData =
        resultado.sello_parroquia_data || '';

      this.parroco.selloParroquiaTipo =
        resultado.sello_parroquia_tipo || '';

      this.actualizarVistaFirma();

    } catch (error: any) {

      console.error('Error al cargar configuración:', error);

      this.mensaje =
        error?.message || 'Ocurrió un error al cargar la configuración.';

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();

    }
  }

  // =====================================================
  // REGRESAR
  // =====================================================

  regresar(): void {
    this.router.navigateByUrl('/principal');
  }

  // =====================================================
  // SELECCIONAR IMÁGENES
  // =====================================================

  seleccionarImagen(event: Event, tipo: TipoImagen): void {

    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    const formatosPermitidos = [
      'image/png',
      'image/jpeg'
    ];

    if (!formatosPermitidos.includes(archivo.type)) {
      this.mensaje = 'Solo se permiten imágenes en formato PNG o JPG.';
      input.value = '';
      return;
    }

    if (archivo.size > this.MAX_SIZE) {
      this.mensaje = 'La imagen no debe superar los 2 MB.';
      input.value = '';
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {

      const resultado = lector.result;

      if (typeof resultado !== 'string') {
        this.mensaje = 'No se pudo procesar la imagen seleccionada.';
        input.value = '';
        return;
      }

      switch (tipo) {

        case 'firma':
          this.parroco.firmaData = resultado;
          this.parroco.firmaTipo = archivo.type;
          this.actualizarVistaFirma();
          break;

        case 'diocesis':
          this.parroco.logoDiocesisData = resultado;
          this.parroco.logoDiocesisTipo = archivo.type;
          break;

        case 'parroquia':
          this.parroco.logoParroquiaData = resultado;
          this.parroco.logoParroquiaTipo = archivo.type;
          break;

        case 'sello':
          this.parroco.selloParroquiaData = resultado;
          this.parroco.selloParroquiaTipo = archivo.type;
          break;
      }

      this.mensaje = '';
    };

    lector.onerror = () => {
      this.mensaje = 'Ocurrió un error al leer la imagen.';
      input.value = '';
    };

    lector.readAsDataURL(archivo);
  }

  // =====================================================
  // VISTA PREVIA DE FIRMA
  // =====================================================

  actualizarVistaFirma(): void {

    const firma = this.parroco.firmaData || '';

    if (!firma) {
      this.firmaPreview = '';
      return;
    }

    this.firmaPreview = firma.startsWith('data:image/')
      ? firma
      : `data:${this.parroco.firmaTipo || 'image/png'};base64,${firma}`;
  }

  // =====================================================
  // IMPORTAR RESPALDO DE WINDOWS EN IPHONE
  // =====================================================

  async importarRespaldo(event: Event): Promise<void> {

    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    if (!this.esMovil) {
      this.mensaje =
        'Esta opción está destinada a la aplicación móvil.';
      input.value = '';
      return;
    }

    if (this.importando || this.guardando) {
      input.value = '';
      return;
    }

    if (!archivo.name.toLowerCase().endsWith('.json')) {
      this.mensaje =
        'Selecciona un archivo de respaldo con extensión JSON.';
      input.value = '';
      return;
    }

    this.importando = true;
    this.mensaje = 'Verificando e importando el respaldo...';
    this.cdr.detectChanges();

    try {

      const resultado = await this.sqlite.importarArchivo(archivo);

      if (!resultado?.success) {
        throw new Error(
          resultado?.message || 'No se pudo completar la importación.'
        );
      }

      await this.cargarConfiguracion();

      const cantidades = resultado.cantidades || {};

      const total =
        Number(cantidades.usuarios || 0) +
        Number(cantidades.configuracion_parroquial || 0) +
        Number(cantidades.bautizos || 0) +
        Number(cantidades.comuniones || 0) +
        Number(cantidades.confirmaciones || 0) +
        Number(cantidades.matrimonios || 0);

      this.mensaje =
        `Respaldo importado correctamente. Se importaron ${total} registros.`;

      console.log(
        '[IOS] Respaldo importado correctamente:',
        cantidades
      );

    } catch (error: any) {

      console.error('[IOS] Error al importar respaldo:', error);

      this.mensaje =
        error?.message || 'Ocurrió un error al importar el respaldo.';

    } finally {

      this.importando = false;
      input.value = '';
      this.cdr.detectChanges();

    }
  }

  // =====================================================
  // GUARDAR CONFIGURACIÓN
  // =====================================================

  async guardarConfiguracion(): Promise<void> {

    if (this.guardando || this.importando) {
      return;
    }

    this.mensaje = '';

    if (!this.parroco.nombre.trim()) {
      this.mensaje = 'Ingrese el nombre completo del párroco.';
      return;
    }

    if (!this.parroco.diocesisNombre.trim()) {
      this.mensaje = 'Ingrese el nombre de la diócesis.';
      return;
    }

    if (!this.parroco.vicariaNombre.trim()) {
      this.mensaje = 'Ingrese el nombre de la vicaría.';
      return;
    }

    if (!this.parroco.parroquiaNombre.trim()) {
      this.mensaje = 'Ingrese el nombre de la parroquia.';
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    try {

      const datos = {
        nombre: this.parroco.nombre.trim(),
        pieFirma: this.parroco.pieFirma.trim() || 'Párroco',

        firmaData: this.parroco.firmaData,
        firmaTipo: this.parroco.firmaTipo,

        identidad: {
          diocesis_nombre: this.parroco.diocesisNombre.trim(),
          vicaria_nombre: this.parroco.vicariaNombre.trim(),
          parroquia_nombre: this.parroco.parroquiaNombre.trim(),

          logo_diocesis_data: this.parroco.logoDiocesisData,
          logo_diocesis_tipo: this.parroco.logoDiocesisTipo,

          logo_parroquia_data: this.parroco.logoParroquiaData,
          logo_parroquia_tipo: this.parroco.logoParroquiaTipo,

          sello_parroquia_data: this.parroco.selloParroquiaData,
          sello_parroquia_tipo: this.parroco.selloParroquiaTipo
        }
      };

      if (this.esMovil) {

        await this.sqlite.ejecutarCambios(
          `INSERT INTO configuracion_parroquial (
            id,
            parroco_nombre,
            pie_firma,
            parroco_firma_data,
            parroco_firma_tipo,
            diocesis_nombre,
            vicaria_nombre,
            parroquia_nombre,
            logo_diocesis_data,
            logo_diocesis_tipo,
            logo_parroquia_data,
            logo_parroquia_tipo,
            sello_parroquia_data,
            sello_parroquia_tipo,
            fecha_actualizacion
          ) VALUES (
            1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
          )
          ON CONFLICT(id) DO UPDATE SET
            parroco_nombre = excluded.parroco_nombre,
            pie_firma = excluded.pie_firma,
            parroco_firma_data = excluded.parroco_firma_data,
            parroco_firma_tipo = excluded.parroco_firma_tipo,
            diocesis_nombre = excluded.diocesis_nombre,
            vicaria_nombre = excluded.vicaria_nombre,
            parroquia_nombre = excluded.parroquia_nombre,
            logo_diocesis_data = excluded.logo_diocesis_data,
            logo_diocesis_tipo = excluded.logo_diocesis_tipo,
            logo_parroquia_data = excluded.logo_parroquia_data,
            logo_parroquia_tipo = excluded.logo_parroquia_tipo,
            sello_parroquia_data = excluded.sello_parroquia_data,
            sello_parroquia_tipo = excluded.sello_parroquia_tipo,
            fecha_actualizacion = CURRENT_TIMESTAMP`,
          [
            datos.nombre,
            datos.pieFirma,
            datos.firmaData,
            datos.firmaTipo,
            datos.identidad.diocesis_nombre,
            datos.identidad.vicaria_nombre,
            datos.identidad.parroquia_nombre,
            datos.identidad.logo_diocesis_data,
            datos.identidad.logo_diocesis_tipo,
            datos.identidad.logo_parroquia_data,
            datos.identidad.logo_parroquia_tipo,
            datos.identidad.sello_parroquia_data,
            datos.identidad.sello_parroquia_tipo
          ]
        );

      } else {

        const api = (window as any).iglesia;

        if (!api?.parroco?.guardar) {
          throw new Error(
            'No se encuentra disponible la conexión para guardar.'
          );
        }

        const resultado = await api.parroco.guardar(datos);

        if (resultado === false || resultado?.error) {
          throw new Error(
            resultado?.error || 'No se pudo guardar la configuración.'
          );
        }
      }

      this.ngZone.run(() => {

        this.actualizarVistaFirma();

        this.mensaje =
          'La configuración parroquial se guardó correctamente.';

        this.cdr.detectChanges();

      });

    } catch (error: any) {

      console.error('Error al guardar configuración:', error);

      this.ngZone.run(() => {

        this.mensaje =
          error?.message || 'Ocurrió un error al guardar la configuración.';

        this.cdr.detectChanges();

      });

    } finally {

      this.guardando = false;
      this.cdr.detectChanges();

    }
  }
}