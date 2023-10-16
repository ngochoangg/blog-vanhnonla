import express from 'express';
import * as env from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
//Secure packages
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp'; //http polution
import cookieParser from 'cookie-parser';

import postRouter from './src/routes/postRoutes.js';
import userRouter from './src/routes/userRoutes.js';
import viewRouter from './src/routes/viewRoutes.js';

import globalErrorHandler from './src/controllers/errorController.js';
import AppError from './src/utils/appError.js';

env.config({ path: './.env' });
const app = express();

//Set views engine
app.set('view engine', 'pug');
app.set('views', path.join(path.resolve(), 'src', 'views'));
app.use(express.static(path.join(path.resolve(), 'public')));
app.use(
  '/tinymce',
  express.static(path.join(path.resolve(), 'node_modules', 'tinymce')),
);

const PORT = process.env.PORT || 5511;
const DB = process.env.MONGO_ATLAS.replace(
  '<PASSWORD>',
  process.env.MONGO_DB_PASSWORD,
);

//Uncaught error handler
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT REJECTION. Shutting down system...');
  process.exit(1);
});

mongoose.connect(DB).then(() => {
  console.log('DB connected!');
});

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 100,
  message: 'Too many request, please try again in 30 minutes!',
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives,
        'img-src': ["'self'", 'data: https:'],
      },
    },
  }),
);
app.use('/api', limiter);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
// app.use(express.urlencoded());
app.use(cookieParser());

//Data sanitize against NoSQL query injection
app.use(mongoSanitize());

//Data sanitize against XSS
app.use(xss());

//Prevent parameters pollution
app.use(hpp());

app.use('/', viewRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  return next(new AppError(`Cannot find ${req.originalUrl} on Server!`, 404));
});

app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  console.log('App running on port: ', PORT);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION. Shutting down system...');
  server.close(() => {
    process.exit(1);
  });
});
