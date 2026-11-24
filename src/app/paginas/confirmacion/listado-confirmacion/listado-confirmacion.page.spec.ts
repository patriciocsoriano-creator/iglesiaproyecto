import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoConfirmacionPage } from './listado-confirmacion.page';

describe('ListadoConfirmacionPage', () => {
  let component: ListadoConfirmacionPage;
  let fixture: ComponentFixture<ListadoConfirmacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoConfirmacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
