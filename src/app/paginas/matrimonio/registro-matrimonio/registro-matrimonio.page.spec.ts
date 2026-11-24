import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroMatrimonioPage } from './registro-matrimonio.page';

describe('RegistroMatrimonioPage', () => {
  let component: RegistroMatrimonioPage;
  let fixture: ComponentFixture<RegistroMatrimonioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroMatrimonioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
