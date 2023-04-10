export const ROOT_ROUTER_WATERMARK = '__root_router__';
export const ROUTER_WATERMARK = '__router__';
export const ROUTER_MODEL = '__router_model__';
export const ROUTER_OPTIONS = '__router_options__';
export const ARGS_METADATA = '__args_metadata__';
export const OPTIONS_METADATA = '__opts_metadata__';

export const GLOBAL_PERMISSIONS_WATERMARK = '__global_permissions__';
export const DOC_PERMISSIONS_WATERMARK = '__doc_permissions__';
export const ROUTE_GUARD_WATERMARK = '__route_guard__';
export const BASE_FILTER_WATERMARK = '__base_filter__';
export const VALIDATE_WATERMARK = '__validate__';
export const PREPARE_WATERMARK = '__prepare__';
export const TRANSFORM_WATERMARK = '__transform__';
export const DECORATE_WATERMARK = '__decorate__';
export const DECORATE_ALL_WATERMARK = '__decorate_all__';

export enum HookParamtypes {
  REQUEST,
  DOCUMENT,
  CONTEXT,
  PERMISSIONS,
}

export const GLOBAL_PERMISSIONS_ARGS = [HookParamtypes.REQUEST];
export const DOC_PERMISSIONS_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];
export const ROUTE_GUARD_ARGS = [HookParamtypes.PERMISSIONS];
export const BASE_FILTER_ARGS = [HookParamtypes.PERMISSIONS];
export const VALIDATE_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];
export const PREPARE_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];
export const TRANSFORM_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];
export const DECORATE_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];
export const DECORATE_ALL_ARGS = [HookParamtypes.DOCUMENT, HookParamtypes.PERMISSIONS, HookParamtypes.CONTEXT];

export const ARGS = {
  globalPermissions: GLOBAL_PERMISSIONS_ARGS,
  docPermissions: DOC_PERMISSIONS_ARGS,
  routeGuard: ROUTE_GUARD_ARGS,
  baseFilter: BASE_FILTER_ARGS,
  validate: VALIDATE_ARGS,
  prepare: PREPARE_ARGS,
  transform: TRANSFORM_ARGS,
  decorate: DECORATE_ARGS,
  decorateAll: DECORATE_ALL_ARGS,
};
