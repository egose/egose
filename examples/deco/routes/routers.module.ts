import mongoose from 'mongoose';
import { RootRouter } from './root.router';
import { UserRouter } from './user.router';
import { OrgRouter } from './org.router';
import { Module, Option, GlobalPermissions, Request } from '@egose/deco';

@Module({
  routers: [RootRouter, UserRouter, OrgRouter],
  options: { baseUrl: '/api' },
})
export class RoutersModule {
  @Option() permissionField = '_permissions';

  @GlobalPermissions()
  async globalPermissions(@Request() req) {
    const User = mongoose.model('User');
    const userName = req.headers.user;

    let user;
    if (userName) {
      user = await User.findOne({ name: userName });
    }

    req._user = user;
    return { isAdmin: user?.role === 'admin' };
  }
}
