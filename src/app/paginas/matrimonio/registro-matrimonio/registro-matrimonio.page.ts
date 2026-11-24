import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

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

  // Lugares donde puede celebrarse el sacramento.
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarParrocoVigente();
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
      const api = (window as any).iglesia;

      if (!api?.parroco?.obtener) {
        throw new Error(
          'No se encuentra disponible la conexión con SQLite.'
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
        'Error al cargar configuración parroquial:',
        error
      );

      this.mensajeError =
        error?.message ||
        'No se pudieron cargar los datos del párroco.';

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

    const fechaMatrimonio =
      this.matrimonio.fecha_matrimonio;

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
      const api = (window as any).iglesia;

      if (!api?.matrimonios?.guardar) {
        throw new Error(
          'No se encuentra disponible la función para guardar matrimonios. Verifique preload.cjs.'
        );
      }

      const datos = {
        numero_matrimonio:
          this.matrimonio.numero_matrimonio.trim(),

        fecha_matrimonio:
          this.matrimonio.fecha_matrimonio,

        tomo_matrimonio:
          this.matrimonio.tomo_matrimonio.trim(),

        pagina_matrimonio:
          this.matrimonio.pagina_matrimonio.trim(),

        lugar_matrimonio:
          this.matrimonio.lugar_matrimonio.trim(),

        ministro:
          this.matrimonio.ministro.trim(),

        nombres_esposo:
          this.matrimonio.nombres_esposo.trim(),

        apellidos_esposo:
          this.matrimonio.apellidos_esposo.trim(),

        cedula_esposo:
          this.matrimonio.cedula_esposo.trim(),

        fecha_nacimiento_esposo:
          this.matrimonio.fecha_nacimiento_esposo,

        lugar_nacimiento_esposo:
          this.matrimonio.lugar_nacimiento_esposo.trim(),

        nombre_padre_esposo:
          this.matrimonio.nombre_padre_esposo.trim(),

        nombre_madre_esposo:
          this.matrimonio.nombre_madre_esposo.trim(),

        parroquia_bautismo_esposo:
          this.matrimonio.parroquia_bautismo_esposo.trim(),

        nombres_esposa:
          this.matrimonio.nombres_esposa.trim(),

        apellidos_esposa:
          this.matrimonio.apellidos_esposa.trim(),

        cedula_esposa:
          this.matrimonio.cedula_esposa.trim(),

        fecha_nacimiento_esposa:
          this.matrimonio.fecha_nacimiento_esposa,

        lugar_nacimiento_esposa:
          this.matrimonio.lugar_nacimiento_esposa.trim(),

        nombre_padre_esposa:
          this.matrimonio.nombre_padre_esposa.trim(),

        nombre_madre_esposa:
          this.matrimonio.nombre_madre_esposa.trim(),

        parroquia_bautismo_esposa:
          this.matrimonio.parroquia_bautismo_esposa.trim(),

        padrino_boda:
          this.matrimonio.padrino_boda.trim(),

        madrina_boda:
          this.matrimonio.madrina_boda.trim(),

        testigo_1:
          this.matrimonio.testigo_1.trim(),

        testigo_2:
          this.matrimonio.testigo_2.trim(),

        anio_registro_civil:
          this.matrimonio.anio_registro_civil.trim(),

        libro_registro_civil:
          this.matrimonio.libro_registro_civil.trim(),

        folio_registro_civil:
          this.matrimonio.folio_registro_civil.trim(),

        acta_registro_civil:
          this.matrimonio.acta_registro_civil.trim(),

        observacion:
          this.matrimonio.observacion.trim()
      };

      const resultado =
        await api.matrimonios.guardar(datos);

      if (!resultado?.success) {
        throw new Error(
          resultado?.message ||
          'No se pudo guardar el matrimonio.'
        );
      }

      this.ngZone.run(() => {
        this.matrimonioId = resultado.id;
        this.matrimonioGuardado = true;
        this.mensajeError = '';

        this.cdr.detectChanges();
      });

      await this.mostrarAlerta(
        'Registro completado',
        `El matrimonio se registró correctamente.\nNúmero de registro: ${resultado.id}`
      );

    } catch (error: any) {
      console.error(
        'Error al guardar matrimonio:',
        error
      );

      this.mensajeError =
        error?.message ||
        'Ocurrió un error al guardar el matrimonio.';

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

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
      const resultado =
        await (window as any).iglesia.bautizos.buscarPorCedula(
          numeroCedula
        );

      if (this.matrimonio.cedula_esposo !== numeroCedula) {
        return;
      }

      if (
        resultado?.success &&
        resultado.encontrado &&
        resultado.bautismo
      ) {
        const datos = resultado.bautismo;

        this.ngZone.run(() => {
          this.matrimonio.nombres_esposo =
            datos.nombres_bautizado ||
            this.matrimonio.nombres_esposo;

          this.matrimonio.apellidos_esposo =
            datos.apellidos_bautizado ||
            this.matrimonio.apellidos_esposo;

          this.matrimonio.fecha_nacimiento_esposo =
            datos.fecha_nacimiento ||
            this.matrimonio.fecha_nacimiento_esposo;

          this.matrimonio.lugar_nacimiento_esposo =
            datos.lugar_nacimiento ||
            this.matrimonio.lugar_nacimiento_esposo;

          this.matrimonio.parroquia_bautismo_esposo =
  datos.lugar_bautizo ||
  this.matrimonio.parroquia_bautismo_esposo;

          this.matrimonio.nombre_padre_esposo =
            datos.nombre_padre ||
            this.matrimonio.nombre_padre_esposo;

          this.matrimonio.nombre_madre_esposo =
            datos.nombre_madre ||
            this.matrimonio.nombre_madre_esposo;

          this.mensajeBusquedaEsposo =
            'Datos encontrados. Se completó la información del esposo.';

          this.cdr.detectChanges();
        });

      } else {
        this.ngZone.run(() => {
          this.mensajeBusquedaEsposo =
            'No se encontraron antecedentes de bautismo. Ingrese los datos manualmente.';

          this.cdr.detectChanges();
        });
      }

    } catch (error) {
      console.error(
        'Error buscando datos del esposo:',
        error
      );

      this.ngZone.run(() => {
        this.mensajeBusquedaEsposo =
          'No se pudo realizar la búsqueda. Puede ingresar los datos manualmente.';

        this.cdr.detectChanges();
      });

    } finally {
      this.ngZone.run(() => {
        this.buscandoEsposo = false;
        this.cdr.detectChanges();
      });
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
      const resultado =
        await (window as any).iglesia.bautizos.buscarPorCedula(
          numeroCedula
        );

      if (this.matrimonio.cedula_esposa !== numeroCedula) {
        return;
      }

      if (
        resultado?.success &&
        resultado.encontrado &&
        resultado.bautismo
      ) {
        const datos = resultado.bautismo;

        this.ngZone.run(() => {
          this.matrimonio.nombres_esposa =
            datos.nombres_bautizado ||
            this.matrimonio.nombres_esposa;

          this.matrimonio.apellidos_esposa =
            datos.apellidos_bautizado ||
            this.matrimonio.apellidos_esposa;

          this.matrimonio.fecha_nacimiento_esposa =
            datos.fecha_nacimiento ||
            this.matrimonio.fecha_nacimiento_esposa;

          this.matrimonio.lugar_nacimiento_esposa =
            datos.lugar_nacimiento ||
            this.matrimonio.lugar_nacimiento_esposa;

          this.matrimonio.parroquia_bautismo_esposa =
  datos.lugar_bautizo ||
  this.matrimonio.parroquia_bautismo_esposa;

          this.matrimonio.nombre_padre_esposa =
            datos.nombre_padre ||
            this.matrimonio.nombre_padre_esposa;

          this.matrimonio.nombre_madre_esposa =
            datos.nombre_madre ||
            this.matrimonio.nombre_madre_esposa;

          this.mensajeBusquedaEsposa =
            'Datos encontrados. Se completó la información de la esposa.';

          this.cdr.detectChanges();
        });

      } else {
        this.ngZone.run(() => {
          this.mensajeBusquedaEsposa =
            'No se encontraron antecedentes de bautismo. Ingrese los datos manualmente.';

          this.cdr.detectChanges();
        });
      }

    } catch (error) {
      console.error(
        'Error buscando datos de la esposa:',
        error
      );

      this.ngZone.run(() => {
        this.mensajeBusquedaEsposa =
          'No se pudo realizar la búsqueda. Puede ingresar los datos manualmente.';

        this.cdr.detectChanges();
      });

    } finally {
      this.ngZone.run(() => {
        this.buscandoEsposa = false;
        this.cdr.detectChanges();
      });
    }
  }

  // =====================================================
  // REGRESAR
  // =====================================================

  regresar(): void {
    this.router.navigateByUrl('/matrimonio');
  }
}