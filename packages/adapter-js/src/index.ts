declare module 'axios' {
  let mergeConfig: (config1: object, config2: object) => object;
}
import { createAdapter } from './adapter';
export * from './service';
export * from './model';
export * from './types';
export * from './utils';

export { createAdapter };
export default { createAdapter };
