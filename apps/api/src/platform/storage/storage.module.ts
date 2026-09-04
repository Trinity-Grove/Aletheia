import { Module } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service.js';
import { AV_SCANNER } from './av-scanner.js';
import { NoopAvScanner } from './noop-av-scanner.js';

@Module({
  providers: [
    ObjectStorageService,
    NoopAvScanner,
    {
      provide: AV_SCANNER,
      useExisting: NoopAvScanner,
    },
  ],
  exports: [ObjectStorageService, AV_SCANNER],
})
export class StorageModule {}
