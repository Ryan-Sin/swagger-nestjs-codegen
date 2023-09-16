import { ERROR_TYPE } from './enum';

export class CommonError extends Error {
  type: ERROR_TYPE;
  status: string;
  clientErrorMessage: string;

  constructor(
    type: ERROR_TYPE,
    status: string,
    clientErrorMessage: string,
    ...params
  ) {
    super(...params);
    this.type = type || ERROR_TYPE.SYSTEM;
    this.status = status;
    this.clientErrorMessage = clientErrorMessage;
  }
}
