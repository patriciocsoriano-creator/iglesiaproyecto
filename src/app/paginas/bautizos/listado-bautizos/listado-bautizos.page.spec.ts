import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoBautizosPage } from './listado-bautizos.page';

describe('ListadoBautizosPage', () => {
  let component: ListadoBautizosPage;
  let fixture: ComponentFixture<ListadoBautizosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoBautizosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
