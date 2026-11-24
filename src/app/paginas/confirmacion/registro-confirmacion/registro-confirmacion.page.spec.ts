import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroConfirmacionPage } from './registro-confirmacion.page';

describe('RegistroConfirmacionPage', () => {
  let component: RegistroConfirmacionPage;
  let fixture: ComponentFixture<RegistroConfirmacionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroConfirmacionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
