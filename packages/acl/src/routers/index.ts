export * from './model-router';
export * from './root-router';
import JsonRouter from 'express-json-router';

JsonRouter.errorMessageProvider = function (error) {
  console.error(error);
  return error.message || error._message || error;
};
