import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  HttpException,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';
import * as moment from 'moment';
import { stringifyWithoutCircular } from './common';

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

    this.logger.error(
      `Message: ${stringifyWithoutCircular(
        exception.message,
      )}, Stack: ${stringifyWithoutCircular(exception.stack)}`,
    );

    httpAdapter.reply(
      ctx.getResponse(),
      {
        common: {
          createdAt: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          status: httpStatus >= 500 ? 'disaster' : 'fail',
          message:
            httpStatus >= 500
              ? '개발 팀의 문의해주세요.'
              : httpStatus < 500 && httpStatus >= 400
              ? exception.response.message
              : exception.message,
        },
      },
      200,
    );
  }
}
