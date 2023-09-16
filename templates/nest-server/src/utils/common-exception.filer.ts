import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';

import { HttpAdapterHost } from '@nestjs/core';
import { CommonError } from './common-exception';

import * as dayjs from 'dayjs';
import { stringifyWithoutCircular } from './common';

/**
 * @Catch(CommonError)
 * 해당 데코레이터는 필요한 메타 데이터를 ExceptionFilter에 바인딩하여,
 * 필터가 CommonError는 타입의 예외만 찾고 있다는 것을 Nset.js에 알리기 위해 선언한다.
 *
 * CommonError는 비즈니스 로직에서 발생할 수 있는 Error를 캐치하여 클라이언트에게 반환한다.
 */
@Catch(CommonError)
export class CommonExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {}

  /**
   * @author Ryan
   * @description 예외 처리 함수
   *
   * @param commonError 현재 처리 중인 예외 객체
   * @param host ArgumentsHost 객체 -> 핸들러에 전달되는 인수를 검색하는 메서드를 제공한다 (Express를 사용하는 경우 - Response & Request & Next 제공)
   */
  catch(commonError: CommonError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const {
      type,
      status,
      message: serverErrorMessage,
      clientErrorMessage,
    } = commonError;

    this.logger.debug(
      `${stringifyWithoutCircular({
        type,
        status,
        serverErrorMessage,
        clientErrorMessage,
      })}`,
    );

    /* 클라이언트에게 정보를 전달한다. */
    httpAdapter.reply(
      ctx.getResponse(),
      {
        common: {
          createdAt: dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          status: commonError.status,
          message: clientErrorMessage,
        },
      },
      200,
    );
  }
}
