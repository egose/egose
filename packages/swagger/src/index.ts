import swaggerUi from 'swagger-ui-express';
import m2s from 'mongoose-to-swagger';
import forEach from 'lodash/forEach';
import set from 'lodash/set';
import { ModelRouter, StatusCodes } from '@egose/acl';
import template from './template.json';

export enum ContentTypes {
  JSON = 'application/json',
  XML = 'application/xml',
  TEXT = 'text/plain',
}

const responses = {
  [StatusCodes.OK]: ({ schema }) => ({
    [StatusCodes.OK]: {
      description: 'OK',
      content: {
        [ContentTypes.JSON]: {
          schema,
        },
      },
    },
  }),
  [StatusCodes.Created]: ({ schema }) => ({
    [StatusCodes.Created]: {
      description: 'Created',
      content: {
        [ContentTypes.JSON]: {
          schema,
        },
      },
    },
  }),
  [StatusCodes.BadRequest]: () => ({
    [StatusCodes.BadRequest]: {
      description: 'Bad Request',
    },
  }),
  [StatusCodes.Unauthorized]: () => ({
    [StatusCodes.Unauthorized]: {
      description: 'Unauthorized',
    },
  }),
  [StatusCodes.Forbidden]: () => ({
    [StatusCodes.Forbidden]: {
      description: 'Forbidden',
    },
  }),
  [StatusCodes.NotFound]: () => ({
    [StatusCodes.NotFound]: {
      description: 'NotFound',
    },
  }),
};

const queryParams = {
  limit: {
    in: 'query',
    name: 'limit',
    description: 'The maximum number of documents',
    schema: {
      type: 'integer',
    },
    required: false,
  },
  page: {
    in: 'query',
    name: 'page',
    description: 'The page number of documents; starts from 1',
    schema: {
      type: 'integer',
    },
    required: false,
  },
  include_permissions: {
    in: 'query',
    name: 'include_permissions',
    description: 'Whether to include document permissions',
    schema: {
      type: 'boolean',
    },
    required: false,
  },
  include_count: {
    in: 'query',
    name: 'include_count',
    description: 'Whether to include total results count',
    schema: {
      type: 'boolean',
    },
    required: false,
  },
  try_list: {
    in: 'query',
    name: 'try_list',
    description: 'Whether to attempt to retrieve the resource if not allowed',
    schema: {
      type: 'boolean',
    },
    required: false,
  },
  lean: {
    in: 'query',
    name: 'lean',
    description: 'Whether to pass plain objects, not Mongoose Documents, in middleware',
    schema: {
      type: 'boolean',
    },
    required: false,
  },
  returning_all: {
    in: 'query',
    name: 'returning_all',
    description: 'Whether to return entire document or partial document',
    schema: {
      type: 'boolean',
    },
    required: false,
  },
};

const produces = ['application/json'];

interface Options {
  baseUrl?: string;
}

export class Factory {
  private readonly _routers: ModelRouter[];
  private _document;

  constructor(routers: ModelRouter[], options?: Options) {
    this._routers = routers;
    this._document = { ...template };
    this.buildDocument(options ?? {});
  }

  public get setup() {
    return swaggerUi.setup(this._document);
  }

  public get serve() {
    return swaggerUi.serve;
  }

  private buildDocument(options?: Options) {
    this._document.servers[0].url = options.baseUrl ?? 'http://localhost:3000';

    forEach(this._routers, (router) => {
      this._document.components.schemas[router.modelName] = m2s(router.model.model);
      this.buildPaths(router);
    });
  }

  private buildPaths(router: ModelRouter) {
    const { parentPath, basePath, queryPath, mutationPath, idParam, modelName } = router.options;
    const prefix = `${parentPath}${basePath}`;
    const modelRef = `#/components/schemas/${modelName}`;

    const pathParams = {
      [idParam]: {
        in: 'path',
        name: idParam,
        description: 'Resource identifier',
        schema: {
          type: 'string',
        },
        required: true,
      },
      field: {
        in: 'path',
        name: 'field',
        description: 'The field for which to return distinct values',
        schema: {
          type: 'string',
        },
        required: true,
      },
    };

    //////////
    // LIST //
    //////////
    set(this._document.paths, `${prefix}.get`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns a set of ${modelName} resources.`,
      description: '',
      operationId: '',
      produces,
      parameters: [
        queryParams.limit,
        queryParams.page,
        queryParams.include_permissions,
        queryParams.include_count,
        queryParams.lean,
      ],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            type: 'array',
            items: {
              $ref: modelRef,
            },
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });

    //////////////////
    // LIST - QUERY //
    //////////////////
    set(this._document.paths, `${prefix}/${queryPath}.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns a set of filtered ${modelName} resources that includes selective data fields.`,
      description: '',
      operationId: '',
      produces,
      parameters: [],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                filter: {
                  type: 'object',
                  description: 'Mongoose Filter object',
                },
                select: {
                  oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'string' } }],
                  description: 'Document fields to include or exclude',
                },
                populate: {
                  oneOf: [
                    { type: 'array', items: { type: 'object' } },
                    { type: 'array', items: { type: 'string' } },
                  ],
                  description: 'Document fields to populate',
                },
                sort: {
                  oneOf: [{ type: 'string' }, { type: 'object' }],
                  description: 'Document sort order',
                },
                skip: {
                  type: 'integer',
                  description: 'The number of documents to skip',
                },
                limit: {
                  type: 'integer',
                  description: 'The maximum number of documents',
                },
                page: {
                  type: 'integer',
                  description: 'The page number of documents',
                },
                pageSize: {
                  type: 'integer',
                  description: 'The maximum number of documents',
                },
                options: {
                  type: 'object',
                  properties: {
                    includePermissions: {
                      type: 'boolean',
                      description: 'Whether to include document permissions',
                    },
                    includeCount: {
                      type: 'boolean',
                      description: 'Whether to include total results count',
                    },
                    populateAccess: {
                      type: 'string',
                      enum: ['list', 'read'],
                      description: 'The access level to use in populate method',
                    },
                    lean: {
                      type: 'boolean',
                      description: 'Whether to pass plain objects, not Mongoose Documents, in middleware',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            type: 'array',
            items: {
              $ref: modelRef,
            },
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });

    ////////////
    // CREATE //
    ////////////
    set(this._document.paths, `${prefix}.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Creates a new ${modelName} resource.`,
      description: '',
      operationId: '',
      produces,
      parameters: [queryParams.include_permissions],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              $ref: modelRef,
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.Created]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.BadRequest](),
      },
      security: [],
    });

    ///////////////////////
    // CREATE - MUTATION //
    ///////////////////////
    set(this._document.paths, `${prefix}/${mutationPath}.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Creates a new ${modelName} resource and returns selective data fields.`,
      description: '',
      operationId: '',
      produces,
      parameters: [queryParams.include_permissions],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                data: {
                  $ref: modelRef,
                  description: 'Document data to create',
                },
                select: {
                  oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'string' } }],
                  description: 'Document fields to include or exclude after the creation',
                },
                populate: {
                  oneOf: [
                    { type: 'array', items: { type: 'object' } },
                    { type: 'array', items: { type: 'string' } },
                  ],
                  description: 'Document fields to populate after the creation',
                },
                options: {
                  type: 'object',
                  properties: {
                    includePermissions: {
                      type: 'boolean',
                      description: 'Whether to include document permissions',
                    },
                    populateAccess: {
                      type: 'string',
                      enum: ['list', 'read'],
                      description: 'The access level to use in populate method',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.Created]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.BadRequest](),
      },
      security: [],
    });

    /////////////////
    // NEW - EMPTY //
    /////////////////
    set(this._document.paths, `${prefix}/new.get`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns an empty ${modelName} resource and is used to retrieve sample data as a placeholder.`,
      description: '',
      operationId: '',
      produces,
      parameters: [],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
      },
      security: [],
    });

    //////////
    // READ //
    //////////
    set(this._document.paths, `${prefix}/:${idParam}.get`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns a target ${modelName} resource.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams[idParam], queryParams.include_permissions, queryParams.try_list, queryParams.lean],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
        ...responses[StatusCodes.NotFound](),
      },
      security: [],
    });

    //////////////////
    // READ - QUERY //
    //////////////////
    set(this._document.paths, `${prefix}/${queryPath}/:${idParam}.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns a set of ${modelName} resources that includes selective data fields.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams[idParam]],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                select: {
                  oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'string' } }],
                  description: 'Document fields to include or exclude',
                },
                populate: {
                  oneOf: [
                    { type: 'array', items: { type: 'object' } },
                    { type: 'array', items: { type: 'string' } },
                  ],
                  description: 'Document fields to populate',
                },
                options: {
                  type: 'object',
                  properties: {
                    includePermissions: {
                      type: 'boolean',
                      description: 'Whether to include document permissions',
                    },
                    tryList: {
                      type: 'boolean',
                      description: 'Whether to attempt to retrieve the resource if not allowed',
                    },
                    populateAccess: {
                      type: 'string',
                      enum: ['list', 'read'],
                      description: 'The access level to use in populate method',
                    },
                    lean: {
                      type: 'boolean',
                      description: 'Whether to pass plain objects, not Mongoose Documents, in middleware',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
        ...responses[StatusCodes.NotFound](),
      },
      security: [],
    });

    ////////////
    // UPDATE //
    ////////////
    set(this._document.paths, `${prefix}/:${idParam}.patch`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Updates a target ${modelName} resource.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams[idParam], queryParams.returning_all],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              $ref: modelRef,
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.BadRequest](),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
        ...responses[StatusCodes.NotFound](),
      },
      security: [],
    });

    ///////////////////////
    // UPDATE - MUTATION //
    ///////////////////////
    set(this._document.paths, `${prefix}/${mutationPath}/:${idParam}.patch`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Updates a target ${modelName} resource and returns selective data fields.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams[idParam], queryParams.returning_all],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                data: {
                  $ref: modelRef,
                  description: 'Document data to create',
                },
                select: {
                  oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'string' } }],
                  description: 'Document fields to include or exclude after the update',
                },
                populate: {
                  oneOf: [
                    { type: 'array', items: { type: 'object' } },
                    { type: 'array', items: { type: 'string' } },
                  ],
                  description: 'Document fields to populate after the update',
                },
                options: {
                  type: 'object',
                  properties: {
                    returningAll: {
                      type: 'boolean',
                      description: 'Whether to return entire document or partial document',
                    },
                    includePermissions: {
                      type: 'boolean',
                      description: 'Whether to include document permissions',
                    },
                    populateAccess: {
                      type: 'string',
                      enum: ['list', 'read'],
                      description: 'The access level to use in populate method',
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.BadRequest](),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
        ...responses[StatusCodes.NotFound](),
      },
      security: [],
    });

    ////////////
    // DELETE //
    ////////////
    set(this._document.paths, `${prefix}/:${idParam}.delete`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Deletes a target ${modelName} resource.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams[idParam]],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            type: 'string',
            description: 'Document ID of the deleted document',
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
        ...responses[StatusCodes.NotFound](),
      },
      security: [],
    });

    //////////////
    // DISTINCT //
    //////////////
    set(this._document.paths, `${prefix}/distinct/:field.get`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Finds the distinct values for a specified field across a target ${modelName} collection and returns the results in an array.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams.field],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });

    /////////////////////////
    // DISTINCT - Advanced //
    /////////////////////////
    set(this._document.paths, `${prefix}/distinct/:field.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `finds the distinct values for a specified field across a target ${modelName} collection and returns the results in an array.`,
      description: '',
      operationId: '',
      produces,
      parameters: [pathParams.field],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                filter: {
                  type: 'object',
                  description: 'Mongose Filter that specifies the match rules to retrieve the distinct values',
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });

    ///////////
    // COUNT //
    ///////////
    set(this._document.paths, `${prefix}/count.get`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns the count of ${modelName} documents that the requester is allowed to read.`,
      description: '',
      operationId: '',
      produces,
      parameters: [],
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });

    //////////////////////
    // COUNT - Advanced //
    //////////////////////
    set(this._document.paths, `${prefix}/count.post`, {
      tags: [router.modelName.toLowerCase()],
      summary: `Returns the count of ${modelName} documents that would match a query for the collection.`,
      description: '',
      operationId: '',
      produces,
      parameters: [],
      requestBody: {
        required: false,
        content: {
          [ContentTypes.JSON]: {
            schema: {
              type: 'object',
              properties: {
                filter: {
                  type: 'object',
                  description: 'Mongoose Filter object',
                },
                populateAccess: {
                  type: 'string',
                  enum: ['list', 'read'],
                  description: 'The access level',
                },
              },
            },
          },
        },
      },
      responses: {
        ...responses[StatusCodes.OK]({
          schema: {
            $ref: modelRef,
          },
        }),
        ...responses[StatusCodes.Unauthorized](),
        ...responses[StatusCodes.Forbidden](),
      },
      security: [],
    });
  }
}

export const createOpenAPI = (routers: ModelRouter[], options?: Options) => new Factory(routers, options);
