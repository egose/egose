import { OptionsManager } from './manager';
import { GlobalOptions } from '../interfaces';

const globalOptions = new OptionsManager<GlobalOptions, GlobalOptions>({
  permissionField: '_permissions',
  globalPermissions: () => ({}),
}).build();

export const setGlobalOptions = (options: GlobalOptions) => {
  globalOptions.assign(options);
};

export const setGlobalOption = <K extends keyof GlobalOptions>(key: K, value: GlobalOptions[K]) => {
  globalOptions.set(key, value);
};

export const getGlobalOptions = () => {
  return globalOptions.fetch();
};

export const getGlobalOption = <K extends keyof GlobalOptions>(key: K, defaultValue?: GlobalOptions[K]) => {
  return globalOptions.get(key, defaultValue);
};
