import JsonRouter from 'express-json-router';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import isUndefined from 'lodash/isUndefined';
import forEach from 'lodash/forEach';
import padEnd from 'lodash/padEnd';
import Model from '../model';
import { checkIfReady, listen, getModelSub } from '../meta';
import { setCore } from '../core';
import { setModelOptions, setModelOption, getModelOptions } from '../options';
import { processUrl } from '../lib';
import { handleResultError } from '../helpers';
import { ModelRouterOptions, ExtendedModelRouterOptions, Request } from '../interfaces';
import { logger } from '../logger';

const clientErrors = JsonRouter.clientErrors;
const success = JsonRouter.success;

type SetTargetOption = {
  (option: any): ModelRouter;
  (key: string, option: any): ModelRouter;
};

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setModelOption(this.modelName, key as keyof ExtendedModelRouterOptions, value);
  return this;
}

const parseBooleanString = (str: string, defaultValue?: any) => (str ? str === 'true' : defaultValue);

export class ModelRouter {
  readonly modelName: string;
  readonly router: JsonRouter;
  readonly model: Model;
  readonly options: ModelRouterOptions;
  readonly fullBasePath: string;

  constructor(modelName: string, initialOptions: ModelRouterOptions) {
    setModelOptions(modelName, initialOptions);
    this.options = getModelOptions(modelName);
    this.fullBasePath = processUrl(this.options.parentPath + this.options.basePath);
    this.modelName = modelName;
    this.router = new JsonRouter();
    this.model = new Model(modelName);

    this.setCollectionRoutes();
    this.setDocumentRoutes();

    const runAsyncTasks = () => {
      this.setSubDocumentRoutes();
      this.logEndpoints();
    };

    if (checkIfReady()) {
      runAsyncTasks();
    } else {
      listen(runAsyncTasks);
    }
  }

  ///////////////////////
  // Collection Routes //
  ///////////////////////
  private setCollectionRoutes() {
    //////////
    // LIST //
    //////////
    this.router.get(`${this.options.basePath}`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { skip, limit, page, page_size, skim, include_permissions, include_count, include_extra_headers } =
        req.query;

      const svc = req.macl.getPublicService(this.modelName);

      const includeCount = parseBooleanString(include_count);
      const includeExtraHeaders = parseBooleanString(include_extra_headers);

      const result = await svc._list(
        {},
        { skip, limit, page, pageSize: page_size },
        {
          skim: parseBooleanString(skim),
          includePermissions: parseBooleanString(include_permissions),
          includeCount,
        },
      );

      handleResultError(result);

      const { data, totalCount } = result;

      if (includeCount) {
        if (includeExtraHeaders) {
          req.res.setHeader('egose-total-count', totalCount);
          return data;
        }

        return { count: totalCount, rows: data };
      }

      return data;
    });

    /////////////////////
    // LIST - Advanced //
    /////////////////////
    this.router.post(`${this.options.basePath}/${this.options.queryPath}`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      // @Deprecated option 'query'
      let { query, filter, select, sort, populate, process, skip, limit, page, pageSize, options = {} } = req.body;
      const { skim, includePermissions, includeCount, includeExtraHeaders, populateAccess } = options;

      const svc = req.macl.getPublicService(this.modelName);

      const result = await svc._list(
        filter ?? query,
        { select, sort, populate, process, skip, limit, page, pageSize },
        {
          skim,
          includePermissions,
          includeCount,
          populateAccess,
        },
      );

      handleResultError(result);

      const { data, totalCount } = result;

      if (includeCount) {
        if (includeExtraHeaders) {
          req.res.setHeader('egose-total-count', totalCount);
          return data;
        }

        return { count: totalCount, rows: data };
      }

      return data;
    });

    ////////////
    // CREATE //
    ////////////
    this.router.post(`${this.options.basePath}`, setCore, async (req: Request, res) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'create');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { include_permissions } = req.query;

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._create(req.body, {}, { includePermissions: parseBooleanString(include_permissions) });

      handleResultError(result);

      return new success.Created(result.count === 1 ? result.data[0] : result.data);
    });

    ///////////////////////
    // CREATE - Advanced //
    ///////////////////////
    this.router.post(`${this.options.basePath}/${this.options.mutationPath}`, setCore, async (req: Request, res) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'create');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { include_permissions } = req.query;
      const { data, select, populate, process, options = {} } = req.body;
      const { includePermissions, populateAccess } = options;

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._create(
        data,
        { select, populate, process },
        { includePermissions: includePermissions ?? parseBooleanString(include_permissions), populateAccess },
      );

      handleResultError(result);

      return new success.Created(result.count === 1 ? result.data[0] : result.data);
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.options.basePath}/new`, setCore, async (req: Request) => {
      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._new();

      handleResultError(result);

      return result.data;
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  private setDocumentRoutes() {
    ///////////
    // COUNT //
    ///////////
    this.router.get(`${this.options.basePath}/count`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._count({});

      handleResultError(result);

      return result.data;
    });

    this.router.post(`${this.options.basePath}/count`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      // @Deprecated option 'query'
      const { query, filter, access } = req.body;
      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._count(filter ?? query, access);

      handleResultError(result);

      return result.data;
    });

    //////////
    // READ //
    //////////
    this.router.get(`${this.options.basePath}/:${this.options.idParam}`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const { include_permissions, try_list } = req.query;
      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._read(
        id,
        {},
        {
          includePermissions: parseBooleanString(include_permissions),
          tryList: parseBooleanString(try_list),
        },
      );

      handleResultError(result);

      return result.data;
    });

    //////////////////////////////
    // READ - Advanced - Filter //
    //////////////////////////////
    this.router.post(`${this.options.basePath}/${this.options.queryPath}/__filter`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { filter, select, populate, process, options = {} } = req.body;
      const { skim, includePermissions, tryList, populateAccess } = options;

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._readFilter(
        filter,
        {
          select,
          populate,
          process,
        },
        { skim, includePermissions, tryList, populateAccess },
      );

      handleResultError(result);

      return result.data;
    });

    /////////////////////
    // READ - Advanced //
    /////////////////////
    this.router.post(
      `${this.options.basePath}/${this.options.queryPath}/:${this.options.idParam}`,
      setCore,
      async (req: Request) => {
        const allowed = await req.macl.isAllowed(this.modelName, 'read');
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        let { select, populate, process, options = {} } = req.body;
        const { skim, includePermissions, tryList, populateAccess } = options;

        const svc = req.macl.getPublicService(this.modelName);
        const result = await svc._read(
          id,
          {
            select,
            populate,
            process,
          },
          { skim, includePermissions, tryList, populateAccess },
        );

        handleResultError(result);

        return result.data;
      },
    );

    ////////////
    // UPDATE //
    ////////////
    this.router.patch(`${this.options.basePath}/:${this.options.idParam}`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const { returning_all } = req.query;

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._update(id, req.body, {}, { returningAll: parseBooleanString(returning_all) });

      handleResultError(result);

      return result.data;
    });

    ///////////////////////
    // UPDATE - Advanced //
    ///////////////////////
    this.router.patch(
      `${this.options.basePath}/${this.options.mutationPath}/:${this.options.idParam}`,
      setCore,
      async (req: Request) => {
        const allowed = await req.macl.isAllowed(this.modelName, 'update');
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        const { returning_all } = req.query;
        const { data, select, populate, process, options = {} } = req.body;
        const { returningAll, includePermissions, populateAccess } = options;

        const svc = req.macl.getPublicService(this.modelName);
        const result = await svc._update(
          id,
          data,
          { select, populate, process },
          { returningAll: returningAll ?? parseBooleanString(returning_all), includePermissions, populateAccess },
        );

        handleResultError(result);

        return result.data;
      },
    );

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.options.basePath}/:${this.options.idParam}`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._delete(id);

      handleResultError(result);

      return result.data;
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.options.basePath}/distinct/:field`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._distinct(field);

      handleResultError(result);

      return result.data;
    });

    this.router.post(`${this.options.basePath}/distinct/:field`, setCore, async (req: Request) => {
      const allowed = await req.macl.isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      // @Deprecated option 'query'
      const { query, filter } = req.body;

      const svc = req.macl.getPublicService(this.modelName);
      const result = await svc._distinct(field, { filter: filter ?? query });

      handleResultError(result);

      return result.data;
    });
  }

  /////////////////////////
  // Sub-Document Routes //
  /////////////////////////
  private setSubDocumentRoutes() {
    const subs = getModelSub(this.modelName);

    for (let x = 0; x < subs.length; x++) {
      const sub = subs[x];

      //////////
      // LIST //
      //////////
      this.router.get(`${this.options.basePath}/:${this.options.idParam}/${sub}`, setCore, async (req: Request) => {
        const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.list` as any);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        const svc = req.macl.getPublicService(this.modelName);
        return svc.listSub(id, sub);
      });

      /////////////////////
      // LIST - Advanced //
      /////////////////////
      this.router.post(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/${this.options.queryPath}`,
        setCore,
        async (req: Request) => {
          const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.list` as any);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const svc = req.macl.getPublicService(this.modelName);
          return svc.listSub(id, sub, req.body);
        },
      );

      //////////
      // READ //
      //////////
      this.router.get(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setCore,
        async (req: Request) => {
          const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.read` as any);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const svc = req.macl.getPublicService(this.modelName);
          return svc.readSub(id, sub, subId);
        },
      );

      /////////////////////
      // READ - Advanced //
      /////////////////////
      this.router.post(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId/${this.options.queryPath}`,
        setCore,
        async (req: Request) => {
          const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.read` as any);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const svc = req.macl.getPublicService(this.modelName);
          return svc.readSub(id, sub, subId, req.body);
        },
      );

      ////////////
      // UPDATE //
      ////////////
      this.router.patch(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setCore,
        async (req: Request) => {
          const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.update` as any);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const svc = req.macl.getPublicService(this.modelName);
          return svc.updateSub(id, sub, subId, req.body);
        },
      );

      ////////////
      // CREATE //
      ////////////
      this.router.post(`${this.options.basePath}/:${this.options.idParam}/${sub}`, setCore, async (req: Request) => {
        const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.create` as any);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        const svc = req.macl.getPublicService(this.modelName);
        return svc.createSub(id, sub, req.body);
      });

      ////////////
      // DELETE //
      ////////////
      this.router.delete(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setCore,
        async (req: Request) => {
          const allowed = await req.macl.isAllowed(this.modelName, `subs.${sub}.delete` as any);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const svc = req.macl.getPublicService(this.modelName);
          return svc.deleteSub(id, sub, subId);
        },
      );
    }
  }

  private logEndpoints() {
    forEach(this.router.endpoints, ({ method, path }) => {
      logger.info(`${padEnd(method, 6)} ${processUrl(this.options.parentPath + path)}`);
    });
  }

  set<K extends keyof ExtendedModelRouterOptions>(keyOrOptions: K | ModelRouterOptions, value?: unknown) {
    if (arguments.length === 2 && isString(keyOrOptions)) {
      setModelOption(this.modelName, keyOrOptions as K, value as ExtendedModelRouterOptions[K]);
    }

    if (arguments.length === 1 && isPlainObject(keyOrOptions)) {
      setModelOptions(this.modelName, keyOrOptions as ModelRouterOptions);
    }

    return this;
  }

  setOption<K extends keyof ExtendedModelRouterOptions>(key: K, option: ExtendedModelRouterOptions[K]) {
    setModelOption(this.modelName, key, option);
    return this;
  }

  setOptions(options: ModelRouterOptions) {
    setModelOptions(this.modelName, options);
    return this;
  }

  /**
   * The maximum limit of the number of documents returned from the `list` operation.
   */
  public listHardLimit: SetTargetOption = setOption.bind(this, 'listHardLimit');

  /**
   * The object schema to define the access control policy for each model field.
   */
  public permissionSchema: SetTargetOption = setOption.bind(this, 'permissionSchema');

  /**
   * The object field to store the document permissions.
   */
  public permissionField: SetTargetOption = setOption.bind(this, 'permissionField');

  /**
   * The essential model fields involved in generating document permissions.
   */
  public mandatoryFields: SetTargetOption = setOption.bind(this, 'mandatoryFields');

  /**
   * The function called in the process of generating document permissions.
   */
  public docPermissions: SetTargetOption = setOption.bind(this, 'docPermissions');

  /**
   * The access control policy for CRUDL endpoints.
   * @operation `create`, `list`, `read`, `update`, `delete`
   */
  public routeGuard: SetTargetOption = setOption.bind(this, 'routeGuard');

  /**
   * The base query definitions applied in every query transaction.
   * @operation `list`, `read`, `update`, `delete`
   */
  public baseFilter: SetTargetOption = setOption.bind(this, 'baseFilter');

  /**
   * Middleware
   *
   * The function called before a new/update document data is processed in `prepare` hooks. This method is used to validate `write data` and throw an error if not valid.
   * @operation `create`, `update`
   */
  public validate: SetTargetOption = setOption.bind(this, 'validate');

  /**
   * Middleware
   *
   * The function called before a new document is created or an existing document is updated. This method is used to process raw data passed into the API endpoints.
   * @operation `create`, `update`
   */
  public prepare: SetTargetOption = setOption.bind(this, 'prepare');

  /**
   * Middleware
   *
   * The function called before an updated document is saved.
   * @operation `update`
   */
  public transform: SetTargetOption = setOption.bind(this, 'transform');

  /**
   * Middleware
   *
   * The function called before response data is sent. This method is used to process raw data to apply custom logic before sending the result.
   * @operation `list`, `read`, `create`, `update`
   */
  public decorate: SetTargetOption = setOption.bind(this, 'decorate');

  /**
   * Middleware
   *
   * The function are called before response data is sent and after `decorate` middleware runs. This method is used to process and filter multiple document objects before sending the result.
   * @operation `list`
   */
  public decorateAll: SetTargetOption = setOption.bind(this, 'decorateAll');

  /**
   * The document selector definition with the `id` param.
   * @option `string` | `Function`
   * @operation `read`, `update`, `delete`
   */
  public identifier: SetTargetOption = setOption.bind(this, 'identifier');

  /**
   * The default values used when missing in the operations.
   */
  public defaults: SetTargetOption = setOption.bind(this, 'defaults');

  get routes() {
    return this.router.original;
  }
}
