import { OptionsManager } from './manager';
import { GlobalOptions } from '../interfaces';

const globalOptions = new OptionsManager<GlobalOptions>({
  permissionField: '_permissions',
  globalPermissions: () => ({}),
}).build();

export const setGlobalOptions = (options: GlobalOptions) => {
  globalOptions.assign(options);
};

export const setGlobalOption = (key: string, value: any) => {
  globalOptions.set(key, value);
};

export const getGlobalOptions = () => {
  return globalOptions.fetch();
};

export const getGlobalOption = (key: string, defaultValue?: any) => {
  return globalOptions.get(key, defaultValue);
};
