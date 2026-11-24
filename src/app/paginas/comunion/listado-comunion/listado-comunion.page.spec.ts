import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoComunionPage } from './listado-comunion.page';

describe('ListadoComunionPage', () => {
  let component: ListadoComunionPage;
  let fixture: ComponentFixture<ListadoComunionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ListadoComunionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
