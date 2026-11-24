import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SacramentosPage } from './sacramentos.page';

describe('SacramentosPage', () => {
  let component: SacramentosPage;
  let fixture: ComponentFixture<SacramentosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SacramentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
