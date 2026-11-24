import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoMatrimonioPage } from './listado-matrimonio.page';

describe('ListadoMatrimonioPage', () => {
  let component: ListadoMatrimonioPage;
  let fixture: ComponentFixture<ListadoMatrimonioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoMatrimonioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
