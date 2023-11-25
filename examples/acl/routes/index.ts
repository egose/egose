import express from 'express';
const router = express.Router();

import egose, { Request, guard } from '@egose/acl';
import { createOpenAPI } from '@egose/swagger';
import auth from './auth';
import { NODE_ENV } from '../config';
import userRoutes from './user';
import orgRoutes from './org';
import petDataRoutes from './pet-data';

const setRoutes = async () => {
  const rootRouter = egose.createRouter({
    basePath: '/macl',
    routeGuard: true,
  });

  router.use('/auth', auth);
  router.use('/', userRoutes.routes);
  router.use('/', orgRoutes.routes);
  router.use('/', petDataRoutes.routes);
  router.use('/', rootRouter.routes);
  router.get('/apple/:name', (req, res) => res.json({ pathParams: req.params, queryParams: req.query }));

  const swagger = createOpenAPI([userRoutes, orgRoutes], { baseUrl: 'http://localhost:3000' });
  await swagger.build();

  router.use('/api-docs', swagger.serve);
  router.get('/api-docs', swagger.setup);

  router.get('/guard1', [
    guard('isAdmin'),
    async (req: Request, res, next) => {
      const svc = req.macl.getService('User');
      const { data: user } = await svc.findOne({}, {}, { lean: false });
      res.json(user.permissions);
    },
  ]);

  router.get('/guard2', [
    guard('isAdmin'),
    (req, res, next) => {
      res.json(true);
    },
  ]);

  router.get('/guard3', [
    guard(['isAdmin']),
    (req, res, next) => {
      res.json(true);
    },
  ]);

  router.get('/guard4', [
    guard({ modelName: 'User', id: 'user1', condition: 'edit.role' }),
    (req, res, next) => {
      res.json(true);
    },
  ]);

  // catch 404 and forward to error handler
  router.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  // no stacktraces leaked to user unless in development environment
  router.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: NODE_ENV === 'development' ? err : {},
    });
  });

  return router;
};

export default setRoutes;
