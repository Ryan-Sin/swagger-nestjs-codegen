import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';
import * as dayjs from 'dayjs';
import { stringifyWithoutCircular } from './common';
import { ERROR_MESSAGE } from './constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const method = httpAdapter.getRequestMethod(ctx.getRequest());

    this.logger.error(
      `Method: ${method} Path: ${path}
       Message: ${stringifyWithoutCircular(exception.message)}
       Stack: ${stringifyWithoutCircular(exception.stack)}`,
    );

    httpAdapter.reply(
      ctx.getResponse(),
      {
        common: {
          createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          status: httpStatus >= 500 ? 'disaster' : 'fail',
          message:
            httpStatus >= 500
              ? ERROR_MESSAGE.SERVER_ERROR
              : httpStatus < 500 && httpStatus >= 400
              ? exception.response.message
              : exception.message,
        },
      },
      200,
    );
  }
}
