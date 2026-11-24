
import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

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
  mensaje = '';

  firmaPreview = '';

  parroco = {
    // Datos del párroco
    nombre: '',
    pieFirma: 'Párroco',
    firmaData: '',
    firmaTipo: '',

    // Identidad institucional
    diocesisNombre: 'Diócesis de Santa Elena',
    vicariaNombre: 'Vicaría San José',
    parroquiaNombre: '',

    // Logotipos
    logoDiocesisData: '',
    logoDiocesisTipo: '',
    logoParroquiaData: '',
    logoParroquiaTipo: '',

    // Sello oficial de la parroquia
    selloParroquiaData: '',
    selloParroquiaTipo: ''
  };

  private readonly MAX_SIZE = 2 * 1024 * 1024;

  constructor(private ngZone: NgZone,
  private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  /**
   * Carga la configuración parroquial desde SQLite.
   */
  async cargarConfiguracion(): Promise<void> {
    this.cargando = true;
    this.mensaje = '';

    try {
      const api = (window as any).iglesia;

      if (!api?.parroco?.obtener) {
        throw new Error('No se encuentra disponible la conexión con la base de datos.');
      }

      const resultado = await api.parroco.obtener();

      if (!resultado) {
        throw new Error('No se pudo obtener la configuración parroquial.');
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
    }
  }

  regresar(): void {
  this.router.navigateByUrl('/principal');
}

  /**
   * Selecciona y procesa una imagen:
   * firma, logo de diócesis o logo de parroquia.
   */
  seleccionarImagen(event: Event, tipo: TipoImagen): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    // Validar formato
    const formatosPermitidos = ['image/png', 'image/jpeg'];

    if (!formatosPermitidos.includes(archivo.type)) {
      this.mensaje = 'Solo se permiten imágenes en formato PNG o JPG.';
      input.value = '';
      return;
    }

    // Validar tamaño
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

  /**
   * Actualiza la vista previa de la firma.
   */
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

  /**
   * Guarda todos los datos de mantenimiento en SQLite.
   */
  


async guardarConfiguracion(): Promise<void> {

  if (this.guardando) {
    return;
  }

  this.mensaje = '';

  if (!this.parroco.nombre.trim()) {
    this.mensaje = 'Ingrese el nombre completo del párroco.';
    this.cdr.detectChanges();
    return;
  }

  if (!this.parroco.diocesisNombre.trim()) {
    this.mensaje = 'Ingrese el nombre de la diócesis.';
    this.cdr.detectChanges();
    return;
  }

  if (!this.parroco.vicariaNombre.trim()) {
    this.mensaje = 'Ingrese el nombre de la vicaría.';
    this.cdr.detectChanges();
    return;
  }

  if (!this.parroco.parroquiaNombre.trim()) {
    this.mensaje = 'Ingrese el nombre de la parroquia.';
    this.cdr.detectChanges();
    return;
  }

  this.guardando = true;
  this.cdr.detectChanges();

  try {

    const api = (window as any).iglesia;

    if (!api?.parroco?.guardar) {
      throw new Error(
        'No se encuentra disponible la conexión para guardar.'
      );
    }

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

    console.log('[ANGULAR] Enviando configuración...');

    const resultado = await api.parroco.guardar(datos);

    console.log('[ANGULAR] Respuesta de Electron:', resultado);

    if (resultado === false || resultado?.error) {
      throw new Error(
        resultado?.error || 'No se pudo guardar la configuración.'
      );
    }

    this.ngZone.run(() => {

      this.actualizarVistaFirma();

      this.mensaje =
        'La configuración parroquial se guardó correctamente.';

      this.guardando = false;

      // Forzar actualización visual.
      this.cdr.detectChanges();

      console.log('[ANGULAR] Guardado y vista actualizada');

    });

  } catch (error: any) {

    console.error('[ANGULAR] Error al guardar:', error);

    this.ngZone.run(() => {

      this.mensaje =
        error?.message || 'Ocurrió un error al guardar la configuración.';

      this.guardando = false;

      this.cdr.detectChanges();

    });

  } finally {

    this.ngZone.run(() => {

      this.guardando = false;

      // Última actualización de la interfaz.
      this.cdr.detectChanges();

    });

  }

}
}