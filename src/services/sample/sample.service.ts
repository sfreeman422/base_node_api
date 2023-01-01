import { Logger } from '../../shared/services/logger/logger.service';

export class SampleService {
  private logger = new Logger('SampleService');

  public greet(text: string): string {
    this.logger.info(text, { fn: 'greet' });
    return text;
  }
}
