import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BautizosPage } from './bautizos.page';

describe('BautizosPage', () => {
  let component: BautizosPage;
  let fixture: ComponentFixture<BautizosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BautizosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
