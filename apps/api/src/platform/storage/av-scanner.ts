export interface AvScanResult {
  clean: boolean;
  threatName?: string;
}

export interface AvScanner {
  scan(storageKey: string): Promise<AvScanResult>;
}

export const AV_SCANNER = Symbol('AV_SCANNER');
