
export {};

declare global {

  interface Window {

    iglesia: {

      auth: {
        login: (credentials: {
          usuario: string;
          contrasena: string;
        }) => Promise<{
          success: boolean;
          message?: string;
          user?: {
            id: number;
            usuario: string;
            nombre: string;
            rol: string;
          };
        }>;
      };

      parroco: {
        obtener: () => Promise<any>;
        guardar: (datos: any) => Promise<any>;
      };

      bautizos: {
        guardar: (datos: any) => Promise<any>;
        listar: (busqueda?: string) => Promise<any[]>;
        obtener: (id: number) => Promise<any>;
        buscarPorCedula: (cedula: string) => Promise<any>;
      };

      comuniones: {
        guardar: (datos: any) => Promise<any>;
        listar: (busqueda?: string) => Promise<any[]>;
        obtener: (id: number) => Promise<any>;
      };

      confirmaciones: {
        buscarAntecedentes: (cedula: string) => Promise<any>;
        guardar: (datos: any) => Promise<any>;
        listar: (busqueda?: string) => Promise<any[]>;
        obtener: (id: number) => Promise<any>;
        actualizar: (datos: any) => Promise<{
          success: boolean;
          message?: string;
          changes?: number;
          id?: number;
        }>;
      };

      documentos: {
        guardarPdf: (html: string) => Promise<any>;
        previsualizarImprimir: (html: string) => Promise<any>;
        prepararWhatsApp: (
          html: string,
          mensaje: string
        ) => Promise<any>;
      };


      matrimonios: {
  guardar: (datos: any) => Promise<any>;
  listar: (busqueda?: string) => Promise<any[]>;
  obtener: (id: number) => Promise<any>;
  actualizar: (datos: any) => Promise<{
    success: boolean;
    message?: string;
    changes?: number;
    id?: number;
  }>;
};


    };

  }

}