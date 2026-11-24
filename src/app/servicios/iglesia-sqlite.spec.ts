import { TestBed } from '@angular/core/testing';
import { IglesiaSqlite } from './iglesia-sqlite';

describe('IglesiaSqlite', () => {
  let service: IglesiaSqlite;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IglesiaSqlite);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
