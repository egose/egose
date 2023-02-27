import {
  Router,
  Prepare,
  DocPermissions,
  BaseQuery,
  RouteGuard,
  Request,
  Document,
  Permissions,
  Context,
  Option,
} from '@egose/deco';

@Router('Org', { queryPath: '_extra' })
export class OrgRouter {
  @Option() routeGuard = {
    list: true,
    read: true,
    update: true,
    delete: false,
    create: 'isAdmin',
  };

  @Option() permissionSchema = { name: { list: true, read: true, create: true } };

  @Option() baseUrl = null;

  @DocPermissions('default')
  docPermissions() {
    return { read: false, edit: true };
  }

  @BaseQuery('list')
  listBaseQuery() {
    return true;
  }

  @BaseQuery('read')
  readBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }

  @BaseQuery('update')
  updateBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }

  @BaseQuery('delete')
  deleteBaseQuery(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }
}
