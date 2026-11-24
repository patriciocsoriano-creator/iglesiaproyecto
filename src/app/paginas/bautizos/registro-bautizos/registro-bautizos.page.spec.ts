import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroBautizosPage } from './registro-bautizos.page';

describe('RegistroBautizosPage', () => {
  let component: RegistroBautizosPage;
  let fixture: ComponentFixture<RegistroBautizosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroBautizosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
