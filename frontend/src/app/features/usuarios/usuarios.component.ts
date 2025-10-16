import { Component } from '@angular/core';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';

/**
 * UsuariosComponent
 * Contenedor principal para la gestión de usuarios (RRHH)
 */
@Component({
  selector: 'app-usuarios',
  imports: [UsuariosListComponent],
  template: `<app-usuarios-list />`
})
export class UsuariosComponent {}
