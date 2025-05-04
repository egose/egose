import JsonRouter from 'express-json-router';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isUndefined from 'lodash/isUndefined';
import forEach from 'lodash/forEach';
import padEnd from 'lodash/padEnd';
import Model from '../model';
import { setDataCore } from '../core-data';
import { setDataOption, setDataOptions, getDataOption, getDataOptions, getDataNames } from '../options';
import { processUrl } from '../lib';
import { handleResultError } from '../helpers';
import { DataRouterOptions, Request } from '../interfaces';
import { CustomHeaders } from '../enums';
import { logger } from '../logger';

const clientErrors = JsonRouter.clientErrors;
const success = JsonRouter.success;

type SetTargetOption = {
  (option: any): DataRouter;
  (key: string, option: any): DataRouter;
};

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setDataOption(this.dataName, key as keyof DataRouterOptions, value);
  return this;
}

const parseBooleanString = (str: string, defaultValue?: any) => (str ? str === 'true' : defaultValue);

export class DataRouter {
  readonly dataName: string;
  readonly router: JsonRouter;
  readonly options: DataRouterOptions;
  readonly fullBasePath: string;

  constructor(dataName: string, initialOptions: DataRouterOptions) {
    setDataOptions(dataName, initialOptions);
    this.options = getDataOptions(dataName);
    this.fullBasePath = processUrl(this.options.parentPath + this.options.basePath);
    this.dataName = dataName;
    this.router = new JsonRouter(this.options.basePath, setDataCore);

    this.setCollectionRoutes();
    this.setDocumentRoutes();
  }

  ///////////////////////
  // Collection Routes //
  ///////////////////////
  private setCollectionRoutes() {
    //////////
    // LIST //
    //////////
    this.router.get('', async (req: Request) => {
      const allowed = await req.dacl.isAllowed(this.dataName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { skip, limit, page, page_size, include_count, include_extra_headers } = req.query;

      const svc = req.dacl.getService(this.dataName);

      const includeCount = parseBooleanString(include_count);
      const includeExtraHeaders = parseBooleanString(include_extra_headers);

      const result = await svc.find(
        {},
        { skip, limit, page, pageSize: page_size },
        {
          includeCount,
        },
      );

      handleResultError(result);

      const { data, totalCount } = result;

      if (includeCount) {
        if (includeExtraHeaders) {
          req.res.setHeader(CustomHeaders.TotalCount, totalCount);
          return data;
        }

        return { count: totalCount, rows: data };
      }

      return data;
    });

    /////////////////////
    // LIST - Advanced //
    /////////////////////
    this.router.post(`/${this.options.queryPath}`, async (req: Request) => {
      const allowed = await req.dacl.isAllowed(this.dataName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { filter, select, sort, skip, limit, page, pageSize, options = {} } = req.body ?? {};
      const { includeCount, includeExtraHeaders } = options;

      const svc = req.dacl.getService(this.dataName);

      const result = await svc.find(filter, { select, sort, skip, limit, page, pageSize }, { includeCount });

      handleResultError(result);

      const { data, totalCount } = result;

      if (includeCount) {
        if (includeExtraHeaders) {
          req.res.setHeader(CustomHeaders.TotalCount, totalCount);
          return data;
        }

        return { count: totalCount, rows: data };
      }

      return data;
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  private setDocumentRoutes() {
    //////////
    // READ //
    //////////
    this.router.get(`/:${this.options.idParam}`, async (req: Request) => {
      const allowed = await req.dacl.isAllowed(this.dataName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const svc = req.dacl.getService(this.dataName);
      const result = await svc.findById(id, {}, {});

      handleResultError(result);

      return result.data;
    });

    //////////////////////////////
    // READ - Advanced - Filter //
    //////////////////////////////
    this.router.post(`/${this.options.queryPath}/__filter`, async (req: Request) => {
      const allowed = await req.dacl.isAllowed(this.dataName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { filter, select, options = {} } = req.body ?? {};

      const svc = req.dacl.getService(this.dataName);
      const result = await svc.findOne(filter, { select }, {});

      handleResultError(result);

      return result.data;
    });

    /////////////////////
    // READ - Advanced //
    /////////////////////
    this.router.post(`/${this.options.queryPath}/:${this.options.idParam}`, async (req: Request) => {
      const allowed = await req.dacl.isAllowed(this.dataName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      let { select, options = {} } = req.body ?? {};

      const svc = req.dacl.getService(this.dataName);
      const result = await svc.findById(id, { select }, {});

      handleResultError(result);

      return result.data;
    });
  }

  set<K extends keyof DataRouterOptions>(keyOrOptions: K | DataRouterOptions, value?: unknown) {
    if (arguments.length === 2 && isString(keyOrOptions)) {
      setDataOption(this.dataName, keyOrOptions as K, value as DataRouterOptions[K]);
    }

    if (arguments.length === 1 && isPlainObject(keyOrOptions)) {
      setDataOptions(this.dataName, keyOrOptions as DataRouterOptions);
    }

    return this;
  }

  setOption<K extends keyof DataRouterOptions>(key: K, option: DataRouterOptions[K]) {
    setDataOption(this.dataName, key, option);
    return this;
  }

  setOptions(options: DataRouterOptions) {
    setDataOptions(this.dataName, options);
    return this;
  }

  public data: SetTargetOption = setOption.bind(this, 'data');
  public listHardLimit: SetTargetOption = setOption.bind(this, 'listHardLimit');
  public permissionSchema: SetTargetOption = setOption.bind(this, 'permissionSchema');
  public routeGuard: SetTargetOption = setOption.bind(this, 'routeGuard');
  public baseFilter: SetTargetOption = setOption.bind(this, 'baseFilter');
  public overrideFilter: SetTargetOption = setOption.bind(this, 'overrideFilter');
  public decorate: SetTargetOption = setOption.bind(this, 'decorate');
  public decorateAll: SetTargetOption = setOption.bind(this, 'decorateAll');
  public identifier: SetTargetOption = setOption.bind(this, 'identifier');

  get routes() {
    return this.router.original;
  }
}
