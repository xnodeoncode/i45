declare module "i45-jslogger" {
  export class Logger {
    log(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    // Add more methods/properties as needed
  }
}
