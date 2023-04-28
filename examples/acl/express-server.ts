import express from 'express';
import session from 'express-session';
import mongoose, { mongo } from 'mongoose';
import memorystore from 'memorystore';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import _ from 'lodash';
import db from '../shared/db';
import loadModels from '../shared/models';
import setRoutes from './routes';
import { DATABASE_URI, COOKIE_SESSION_NAME, COOKIE_SESSION_SECRET } from './config';
import egose from '@egose/acl';

console.log(!!loadModels());

egose.setGlobalOption('permissionField', '_permissions');

egose.set('globalPermissions', async function (req) {
  const User = mongoose.model('User');
  const userName = req.headers.user;

  let user;
  if (userName) {
    user = await User.findOne({ name: userName });
  }

  req._user = user;
  return { isAdmin: user?.role === 'admin' };
});

const MemoryStore = memorystore(session);

const ONE_DAY = 24 * (60 * 60 * 1000);

const logger = morgan('combined');

interface Props {
  databaseUrl?: string;
}

const initExpresss = async (options?: Props) => {
  const { databaseUrl } = options || {};

  await db.up({ databaseUrl: databaseUrl || DATABASE_URI });

  const expressServer = express();

  expressServer.use(logger);
  expressServer.use(bodyParser.json());
  expressServer.use(bodyParser.urlencoded({ extended: false }));
  expressServer.use(cookieParser());

  const store = new MemoryStore({
    checkPeriod: ONE_DAY,
  });

  expressServer.use(
    session({
      name: COOKIE_SESSION_NAME,
      secret: COOKIE_SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: ONE_DAY,
        httpOnly: true,
        secure: false,
      },
      store,
    }),
  );

  expressServer.disable('x-powered-by');

  expressServer.set('trust proxy', 1);

  expressServer.use(egose());

  expressServer.use('/api', await setRoutes());

  return expressServer;
};

export default initExpresss;

declare global {
  namespace Express {
    interface Request {
      _permissions?: any;
      _user?: any;
    }
  }

  interface Error {
    status?: number;
  }
}
