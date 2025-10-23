/**
 * Infrastructure Layer Tests
 */

import { LocalStorageService } from './index';

describe('Infrastructure Layer', () => {
  it('should create LocalStorageService', () => {
    const service = new LocalStorageService();
    expect(service).toBeInstanceOf(LocalStorageService);
  });

  it('should store and retrieve data', async () => {
    const service = new LocalStorageService();
    const testData = { key: 'value' };

    await service.save('test-key', testData);
    const result = await service.get('test-key');

    expect(result).toEqual(testData);
  });

  it('should delete data', async () => {
    const service = new LocalStorageService();
    const testData = { key: 'value' };

    await service.save('test-key', testData);
    await service.delete('test-key');
    const result = await service.get('test-key');

    expect(result).toBeUndefined();
  });
});