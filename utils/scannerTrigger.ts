// Global scanner trigger utility
type ScannerTriggerCallback = () => void;

class ScannerTriggerService {
  private callback: ScannerTriggerCallback | null = null;

  setCallback(callback: ScannerTriggerCallback) {
    this.callback = callback;
  }

  trigger() {
    if (this.callback) {
      this.callback();
    }
  }

  clear() {
    this.callback = null;
  }
}

export const scannerTrigger = new ScannerTriggerService();