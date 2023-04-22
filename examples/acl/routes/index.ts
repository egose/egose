import express from 'express';
const router = express.Router();

import macl, { guard } from '@egose/acl';
import { createOpenAPI } from '@egose/swagger';
import auth from './auth';
import { NODE_ENV } from '../config';
import userRoutes from './user';
import orgRoutes from './org';

const rootRouter = macl.createRouter({
  basePath: '/macl',
  routeGuard: true,
});

router.use('/auth', auth);
router.use('/', userRoutes.routes);
router.use('/', orgRoutes.routes);
router.use('/', rootRouter.routes);

const swagger = createOpenAPI([userRoutes, orgRoutes], { baseUrl: 'http://localhost:3000' });
router.use('/api-docs', swagger.serve);
router.get('/api-docs', swagger.setup);

router.get('/user-custom', [
  guard('isAdmin'),
  async (req, res, next) => {
    const model = req.macl('User');
    const { data: user } = await model.findOne({ options: { lean: false } });
    res.json(user.permissions);
  },
]);

router.get('/admin-route', [
  guard('isAdmin'),
  (req, res, next) => {
    res.json(true);
  },
]);

router.get('/admin-route2', [
  guard(['isAdmin']),
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

export default router;
