import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatrimonioPage } from './matrimonio.page';

describe('MatrimonioPage', () => {
  let component: MatrimonioPage;
  let fixture: ComponentFixture<MatrimonioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MatrimonioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
