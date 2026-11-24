import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InscripcionComunionPage } from './inscripcion-comunion.page';

describe('InscripcionComunionPage', () => {
  let component: InscripcionComunionPage;
  let fixture: ComponentFixture<InscripcionComunionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InscripcionComunionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
