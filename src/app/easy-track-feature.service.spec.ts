import { TestBed } from '@angular/core/testing';

import { EasyTrackFeatureService } from './easy-track-feature.service';

describe('EasyTrackFeatureService', () => {
  let service: EasyTrackFeatureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EasyTrackFeatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
