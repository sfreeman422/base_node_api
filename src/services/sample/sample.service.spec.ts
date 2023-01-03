import { SampleService } from './sample.service';

describe('SampleService', () => {
  let sampleService: SampleService;

  beforeEach(() => {
    sampleService = new SampleService();
    const loggerSpy = jest.spyOn(sampleService.logger, 'info');
    loggerSpy.mockImplementation(() => '');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('greet()', () => {
    it('should return the text it is provided', () => {
      expect(sampleService.greet('Test')).toBe('Test');
    });

    it('should not return something it is not given', () => {
      expect(sampleService.greet('Test')).not.toBe('test');
    });
  });
});
