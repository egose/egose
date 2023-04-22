import JsonRouter from 'express-json-router';
import isUndefined from 'lodash/isUndefined';
import forEach from 'lodash/forEach';
import padEnd from 'lodash/padEnd';
import Model from '../model';
import { checkIfReady, listen, getModelSub } from '../meta';
import { setGenerators } from '../generators';
import { setModelOptions, setModelOption } from '../options';
import { ModelRouterOptions, Request } from '../interfaces';
import { CORE } from '../symbols';
import { logger } from '../logger';

const clientErrors = JsonRouter.clientErrors;

type SetTargetOption = {
  (option: any): ModelRouter;
  (key: string, option: any): ModelRouter;
};

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setModelOption(this.modelName, key, value);
  return this;
}

const parseBooleanString = (str: string, defaultValue?: any) => (str ? str === 'true' : defaultValue);

export class ModelRouter {
  readonly modelName: string;
  readonly router: JsonRouter;
  readonly model: Model;
  readonly options: ModelRouterOptions;

  constructor(modelName: string, initialOptions: ModelRouterOptions) {
    this.options = setModelOptions(modelName, initialOptions);
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
    this.router.get(`${this.options.basePath}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { skip, limit, page, page_size, include_permissions, include_count, lean } = req.query;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._list(
        {},
        { skip, limit, page, pageSize: page_size },
        {
          includePermissions: parseBooleanString(include_permissions),
          includeCount: parseBooleanString(include_count),
          lean: parseBooleanString(lean),
        },
      );
    });

    //////////////////
    // LIST - QUERY //
    //////////////////
    this.router.post(`${this.options.basePath}/${this.options.queryPath}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      // @Deprecated option 'query'
      let { query, filter, select, sort, populate, process, skip, limit, page, pageSize, options = {} } = req.body;
      const { includePermissions, includeCount, populateAccess, lean } = options;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._list(
        filter ?? query,
        { select, sort, populate, process, skip, limit, page, pageSize },
        {
          includePermissions,
          includeCount,
          populateAccess,
          lean,
        },
      );
    });

    ////////////
    // CREATE //
    ////////////
    this.router.post(`${this.options.basePath}`, setGenerators, async (req: Request, res) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'create');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { include_permissions } = req.query;

      const ctl = req[CORE]._public(this.modelName);
      const doc = await ctl._create(req.body, {}, { includePermissions: parseBooleanString(include_permissions) });

      res.status(201).json(doc);
    });

    ///////////////////////
    // CREATE - MUTATION //
    ///////////////////////
    this.router.post(
      `${this.options.basePath}/${this.options.mutationPath}`,
      setGenerators,
      async (req: Request, res) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, 'create');
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const { include_permissions } = req.query;
        const { data, select, populate, process, options = {} } = req.body;
        const { includePermissions, populateAccess } = options;

        const ctl = req[CORE]._public(this.modelName);
        const doc = await ctl._create(
          data,
          { select, populate, process },
          { includePermissions: includePermissions ?? parseBooleanString(include_permissions), populateAccess },
        );

        res.status(201).json(doc);
      },
    );

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.options.basePath}/new`, setGenerators, async (req: Request) => {
      const ctl = req[CORE]._public(this.modelName);
      return ctl._empty();
    });
  }

  /////////////////////
  // Document Routes //
  /////////////////////
  private setDocumentRoutes() {
    //////////
    // READ //
    //////////
    this.router.get(`${this.options.basePath}/:${this.options.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const { include_permissions, try_list, lean } = req.query;
      const ctl = req[CORE]._public(this.modelName);
      return ctl._read(
        id,
        {},
        {
          includePermissions: parseBooleanString(include_permissions),
          tryList: parseBooleanString(try_list),
          lean: parseBooleanString(lean),
        },
      );
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    this.router.post(
      `${this.options.basePath}/${this.options.queryPath}/:${this.options.idParam}`,
      setGenerators,
      async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, 'read');
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        let { select, populate, process, options = {} } = req.body;
        const { includePermissions, tryList, populateAccess, lean } = options;

        const ctl = req[CORE]._public(this.modelName);
        return ctl._read(
          id,
          {
            select,
            populate,
            process,
          },
          { includePermissions, tryList, populateAccess, lean },
        );
      },
    );

    ////////////
    // UPDATE //
    ////////////
    this.router.patch(`${this.options.basePath}/:${this.options.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const { returning_all } = req.query;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._update(id, req.body, {}, { returningAll: parseBooleanString(returning_all) });
    });

    ///////////////////////
    // UPDATE - MUTATION //
    ///////////////////////
    this.router.patch(
      `${this.options.basePath}/${this.options.mutationPath}/:${this.options.idParam}`,
      setGenerators,
      async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, 'update');
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.options.idParam];
        const { returning_all } = req.query;
        const { data, select, populate, process, options = {} } = req.body;
        const { returningAll, includePermissions, populateAccess } = options;

        const ctl = req[CORE]._public(this.modelName);
        return ctl._update(
          id,
          data,
          { select, populate, process },
          { returningAll: returningAll ?? parseBooleanString(returning_all), includePermissions, populateAccess },
        );
      },
    );

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.options.basePath}/:${this.options.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.options.idParam];
      const ctl = req[CORE]._public(this.modelName);
      return ctl._delete(id);
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.options.basePath}/distinct/:field`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const ctl = req[CORE]._public(this.modelName);
      return ctl._distinct(field);
    });

    this.router.post(`${this.options.basePath}/distinct/:field`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      // @Deprecated option 'query'
      const { query, filter } = req.body;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._distinct(field, { filter: filter ?? query });
    });

    ///////////
    // COUNT //
    ///////////
    this.router.get(`${this.options.basePath}/count`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const ctl = req[CORE]._public(this.modelName);
      return ctl._count({});
    });

    this.router.post(`${this.options.basePath}/count`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      // @Deprecated option 'query'
      const { query, filter, access } = req.body;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._count(filter ?? query, access);
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
      this.router.get(
        `${this.options.basePath}/:${this.options.idParam}/${sub}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.list`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const ctl = req[CORE]._public(this.modelName);
          return ctl.listSub(id, sub);
        },
      );

      //////////////////
      // LIST - QUERY //
      //////////////////
      this.router.post(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/${this.options.queryPath}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.list`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const ctl = req[CORE]._public(this.modelName);
          return ctl.listSub(id, sub, req.body);
        },
      );

      //////////
      // READ //
      //////////
      this.router.get(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.read`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const ctl = req[CORE]._public(this.modelName);
          return ctl.readSub(id, sub, subId);
        },
      );

      //////////////////
      // READ - QUERY //
      //////////////////
      this.router.post(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId/${this.options.queryPath}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.read`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const ctl = req[CORE]._public(this.modelName);
          return ctl.readSub(id, sub, subId, req.body);
        },
      );

      ////////////
      // UPDATE //
      ////////////
      this.router.patch(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.update`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const ctl = req[CORE]._public(this.modelName);
          return ctl.updateSub(id, sub, subId, req.body);
        },
      );

      ////////////
      // CREATE //
      ////////////
      this.router.post(
        `${this.options.basePath}/:${this.options.idParam}/${sub}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.create`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const ctl = req[CORE]._public(this.modelName);
          return ctl.createSub(id, sub, req.body);
        },
      );

      ////////////
      // DELETE //
      ////////////
      this.router.delete(
        `${this.options.basePath}/:${this.options.idParam}/${sub}/:subId`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.delete`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.options.idParam];
          const { subId } = req.params;
          const ctl = req[CORE]._public(this.modelName);
          return ctl.deleteSub(id, sub, subId);
        },
      );
    }
  }

  private logEndpoints() {
    forEach(this.router.endpoints, ({ method, path }) => {
      logger.info(`${padEnd(method, 6)} ${this.options.parentPath}${path}`);
    });
  }

  set(optionKey: string, option: any) {
    setModelOption(this.modelName, optionKey, option);
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
