import 'reflect-metadata';
import { OPTIONS_METADATA } from '../constants';

/**
 * Attaches the `ClientProxy` instance to the given property
 *
 * @param {string} optionKey optional client metadata
 */
export function Option(optionKey?: string): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    const opts = Reflect.getMetadata(OPTIONS_METADATA, target) || [];
    Reflect.defineMetadata(OPTIONS_METADATA, opts.concat({ optionKey: optionKey || propertyKey, propertyKey }), target);
  };
}
