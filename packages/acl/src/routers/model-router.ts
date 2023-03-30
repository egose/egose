import mongoose from 'mongoose';
import JsonRouter from 'express-json-router';
import get from 'lodash/get';
import intersection from 'lodash/intersection';
import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import pick from 'lodash/pick';
import Model from '../model';
import { checkIfReady, listen, getModelSub } from '../meta';

import { setGenerators, MaclCore } from '../generators';
import {
  getGlobalOption,
  setModelOptions,
  setModelOption,
  getModelOptions,
  DEFAULT_QUERY_PATH,
  DEFAULT_MUTATION_PATH,
} from '../options';
import { RootRouterOptions, ModelRouterOptions, Validation, RootQueryEntry, Request } from '../interfaces';
import { MIDDLEWARE, CORE, PERMISSIONS, PERMISSION_KEYS } from '../symbols';

const pluralize = mongoose.pluralize();
const clientErrors = JsonRouter.clientErrors;

type setOptionType = {
  (option: any): void;
  (key: string, option: any): void;
};

function setOption(parentKey: string, optionKey: any, option?: any) {
  const key = isUndefined(option) ? parentKey : `${parentKey}.${optionKey}`;
  const value = isUndefined(option) ? optionKey : option;

  setModelOption(this.modelName, key, value);
}

const parseBooleanString = (str: string, defaultValue?: any) => (str ? str === 'true' : defaultValue);

export class ModelRouter {
  modelName: string;
  router: JsonRouter;
  model: Model;
  basename: string;
  idParam: string;
  queryPath: string;
  mutationPath: string;

  constructor(modelName: string, options: ModelRouterOptions) {
    const _options = setModelOptions(modelName, options);

    this.modelName = modelName;
    this.router = new JsonRouter();
    this.model = new Model(modelName);

    if (_options.baseUrl === false) {
      this.basename = '';
    } else if (isNil(_options.baseUrl)) {
      this.basename = `/${pluralize(modelName)}`;
    } else {
      this.basename = _options.baseUrl;
    }

    this.idParam = _options.idParam || getGlobalOption('idParam', 'id');
    this.queryPath = _options.queryPath || getGlobalOption('queryPath', DEFAULT_QUERY_PATH);
    this.mutationPath = _options.mutationPath || getGlobalOption('mutationPath', DEFAULT_MUTATION_PATH);
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
    this.router.get(`${this.basename}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { limit, page, include_permissions, include_count, lean } = req.query;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._list(
        {
          limit,
          page,
        },
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
    this.router.post(`${this.basename}/${this.queryPath}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'list');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      let { query, select, sort, populate, process, limit, page, options = {} } = req.body;
      const { includePermissions, includeCount, populateAccess, lean } = options;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._list(
        {
          query,
          select,
          sort,
          populate,
          process,
          limit,
          page,
        },
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
    this.router.post(`${this.basename}`, setGenerators, async (req: Request, res) => {
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
    this.router.post(`${this.basename}/${this.mutationPath}`, setGenerators, async (req: Request, res) => {
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
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    this.router.get(`${this.basename}/new`, setGenerators, async (req: Request) => {
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
    this.router.get(`${this.basename}/:${this.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
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
    this.router.post(`${this.basename}/${this.queryPath}/:${this.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'read');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
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
    });

    ////////////
    // UPDATE //
    ////////////
    this.router.put(`${this.basename}/:${this.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      const { returning_all } = req.query;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._update(id, req.body, {}, { returningAll: parseBooleanString(returning_all) });
    });

    ///////////////////////
    // UPDATE - MUTATION //
    ///////////////////////
    this.router.put(`${this.basename}/${this.mutationPath}/:${this.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'update');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
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
    });

    ////////////
    // DELETE //
    ////////////
    this.router.delete(`${this.basename}/:${this.idParam}`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'delete');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const id = req.params[this.idParam];
      const ctl = req[CORE]._public(this.modelName);
      return ctl._delete(id);
    });

    //////////////
    // DISTINCT //
    //////////////
    this.router.get(`${this.basename}/distinct/:field`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const ctl = req[CORE]._public(this.modelName);
      return ctl._distinct(field);
    });

    this.router.post(`${this.basename}/distinct/:field`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'distinct');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { field } = req.params;
      const { query } = req.body;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._distinct(field, { query });
    });

    ///////////
    // COUNT //
    ///////////
    this.router.get(`${this.basename}/count`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const ctl = req[CORE]._public(this.modelName);
      return ctl._count({});
    });

    this.router.post(`${this.basename}/count`, setGenerators, async (req: Request) => {
      const allowed = await req[CORE]._isAllowed(this.modelName, 'count');
      if (!allowed) throw new clientErrors.UnauthorizedError();

      const { query, access } = req.body;

      const ctl = req[CORE]._public(this.modelName);
      return ctl._count(query, access);
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
      this.router.get(`${this.basename}/:${this.idParam}/${sub}`, setGenerators, async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.list`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const ctl = req[CORE]._public(this.modelName);
        return ctl.listSub(id, sub);
      });

      //////////////////
      // LIST - QUERY //
      //////////////////
      this.router.post(
        `${this.basename}/:${this.idParam}/${sub}/${this.queryPath}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.list`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.idParam];
          const ctl = req[CORE]._public(this.modelName);
          return ctl.listSub(id, sub, req.body);
        },
      );

      //////////
      // READ //
      //////////
      this.router.get(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.read`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const ctl = req[CORE]._public(this.modelName);
        return ctl.readSub(id, sub, subId);
      });

      //////////////////
      // READ - QUERY //
      //////////////////
      this.router.post(
        `${this.basename}/:${this.idParam}/${sub}/:subId/${this.queryPath}`,
        setGenerators,
        async (req: Request) => {
          const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.read`);
          if (!allowed) throw new clientErrors.UnauthorizedError();

          const id = req.params[this.idParam];
          const { subId } = req.params;
          const ctl = req[CORE]._public(this.modelName);
          return ctl.readSub(id, sub, subId, req.body);
        },
      );

      ////////////
      // UPDATE //
      ////////////
      this.router.put(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.update`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const ctl = req[CORE]._public(this.modelName);
        return ctl.updateSub(id, sub, subId, req.body);
      });

      ////////////
      // CREATE //
      ////////////
      this.router.post(`${this.basename}/:${this.idParam}/${sub}`, setGenerators, async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.create`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const ctl = req[CORE]._public(this.modelName);
        return ctl.createSub(id, sub, req.body);
      });

      ////////////
      // DELETE //
      ////////////
      this.router.delete(`${this.basename}/:${this.idParam}/${sub}/:subId`, setGenerators, async (req: Request) => {
        const allowed = await req[CORE]._isAllowed(this.modelName, `subs.${sub}.delete`);
        if (!allowed) throw new clientErrors.UnauthorizedError();

        const id = req.params[this.idParam];
        const { subId } = req.params;
        const ctl = req[CORE]._public(this.modelName);
        return ctl.deleteSub(id, sub, subId);
      });
    }
  }

  private logEndpoints() {
    // listEndpoints(this.routes).forEach((endpoint) => {
    //   if (endpoint.path.startsWith(this.basename)) {
    //     console.log(`ACL: ${endpoint.path} (${endpoint.methods.join(', ')})`);
    //   }
    // });
  }

  set(optionKey: string, option: any) {
    setModelOption(this.modelName, optionKey, option);
  }

  /**
   * The maximum limit of the number of documents returned from the `list` operation.
   */
  public listHardLimit: setOptionType = setOption.bind(this, 'listHardLimit');

  /**
   * The object schema to define the access control policy for each model field.
   */
  public permissionSchema: setOptionType = setOption.bind(this, 'permissionSchema');

  /**
   * The object field to store the document permissions.
   */
  public permissionField: setOptionType = setOption.bind(this, 'permissionField');

  /**
   * The essential model fields involved in generating document permissions.
   */
  public mandatoryFields: setOptionType = setOption.bind(this, 'mandatoryFields');

  /**
   * The function called in the process of generating document permissions.
   */
  public docPermissions: setOptionType = setOption.bind(this, 'docPermissions');

  /**
   * The access control policy for CRUDL endpoints.
   * @operation `create`, `list`, `read`, `update`, `delete`
   */
  public routeGuard: setOptionType = setOption.bind(this, 'routeGuard');

  /**
   * The base query definitions applied in every query transaction.
   * @operation `list`, `read`, `update`, `delete`
   */
  public baseQuery: setOptionType = setOption.bind(this, 'baseQuery');

  /**
   * Middleware
   *
   * The function called before a new/update document data is processed in `prepare` hooks. This method is used to validate `write data` and throw an error if not valid.
   * @operation `create`, `update`
   */
  public validate: setOptionType = setOption.bind(this, 'validate');

  /**
   * Middleware
   *
   * The function called before a new document is created or an existing document is updated. This method is used to process raw data passed into the API endpoints.
   * @operation `create`, `update`
   */
  public prepare: setOptionType = setOption.bind(this, 'prepare');

  /**
   * Middleware
   *
   * The function called before an updated document is saved.
   * @operation `update`
   */
  public transform: setOptionType = setOption.bind(this, 'transform');

  /**
   * Middleware
   *
   * The function called before response data is sent. This method is used to process raw data to apply custom logic before sending the result.
   * @operation `list`, `read`, `create`, `update`
   */
  public decorate: setOptionType = setOption.bind(this, 'decorate');

  /**
   * Middleware
   *
   * The function are called before response data is sent and after `decorate` middleware runs. This method is used to process and filter multiple document objects before sending the result.
   * @operation `list`
   */
  public decorateAll: setOptionType = setOption.bind(this, 'decorateAll');

  /**
   * The document selector definition with the `id` param.
   * @option `string` | `Function`
   * @operation `read`, `update`, `delete`
   */
  public identifier: setOptionType = setOption.bind(this, 'identifier');

  /**
   * The default values used when missing in the operations.
   */
  public defaults: setOptionType = setOption.bind(this, 'defaults');

  get options() {
    return getModelOptions(this.modelName);
  }

  get routes() {
    return this.router.original;
  }
}
