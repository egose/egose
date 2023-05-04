declare module 'axios' {
  let mergeConfig: (config1: object, config2: object) => object;
}
import { createAdapter } from './adapter';

export { createAdapter };
export default { createAdapter };
