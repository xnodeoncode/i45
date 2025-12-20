/**
 * Mock for i45-jslogger package
 */

export class Logger {
  private events: any[] = [];
  private _loggingEnabled: boolean = true;
  private _suppressNative: boolean = false;
  private clients: Set<any> = new Set();

  get loggingEnabled(): boolean {
    return this._loggingEnabled;
  }

  set loggingEnabled(value: boolean) {
    this._loggingEnabled = value;
  }

  get suppressNative(): boolean {
    return this._suppressNative;
  }

  set suppressNative(value: boolean) {
    this._suppressNative = value;
  }

  log(message: string, ...args: any[]) {
    if (!this._loggingEnabled) return;
    if (!this._suppressNative) {
      this.addEvent("LOG", message);
    }
  }

  info(message: string, ...args: any[]) {
    if (!this._loggingEnabled) return;
    if (!this._suppressNative) {
      this.addEvent("INFO", message);
    }
  }

  warn(message: string, ...args: any[]) {
    if (!this._loggingEnabled) return;
    if (!this._suppressNative) {
      this.addEvent("WARN", message);
    }
  }

  error(message: string, ...args: any[]) {
    if (!this._loggingEnabled) return;
    if (!this._suppressNative) {
      this.addEvent("ERROR", message);
    }
  }

  addEvent(type: string, event: string) {
    this.events.push({
      id: new Date().getTime(),
      type,
      event,
      timestamp: new Date().toISOString(),
    });
  }

  getEvents() {
    return this.events;
  }

  clearEventLog() {
    this.events = [];
    return this;
  }

  clearAll() {
    this.events = [];
    return this;
  }

  addClient(client: any): boolean {
    this.clients.add(client);
    return true;
  }

  removeClient(client: any): boolean {
    return this.clients.delete(client);
  }
}
