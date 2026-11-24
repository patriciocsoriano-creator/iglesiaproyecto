import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComunionPage } from './comunion.page';

describe('ComunionPage', () => {
  let component: ComunionPage;
  let fixture: ComponentFixture<ComunionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComunionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
