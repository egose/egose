import {
  Router,
  Prepare,
  DocPermissions,
  BaseFilter,
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

  @Option() basePath = null;

  @DocPermissions('default')
  docPermissions() {
    return { read: false, edit: true };
  }

  @BaseFilter('list')
  listBaseFilter() {
    return true;
  }

  @BaseFilter('read')
  readBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }

  @BaseFilter('update')
  updateBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }

  @BaseFilter('delete')
  deleteBaseFilter(@Request() req, @Permissions() permissions) {
    if (permissions.isAdmin) return {};
    else return { _id: req._user.orgs };
  }
}
