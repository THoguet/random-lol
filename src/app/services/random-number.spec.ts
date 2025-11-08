import { TestBed } from '@angular/core/testing';

import { RandomNumber } from './random-number';

describe('RandomNumber', () => {
  let service: RandomNumber;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RandomNumber);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
