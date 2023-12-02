import mongoose from 'mongoose';
import express from 'express';
import egose from '@egose/acl';
import { createOpenAPI } from '@egose/swagger';

const app = express();
const router = express.Router();

const UserSchema = new mongoose.Schema({
  name: { type: String },
});

mongoose.model('User', UserSchema);

const userRouter = egose.createRouter('User', { parentPath: '/api', basePath: '/users' });

const swagger = createOpenAPI([userRouter], { baseUrl: 'http://localhost:3000' });

router.use('/', userRouter.routes);
router.use('/api-docs', swagger.serve);
router.get('/api-docs', swagger.setup);

app.use('/api', router);

app.listen(3000);
