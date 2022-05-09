export class CommonError extends Error {
  status: string;

  constructor(status, ...params) {
    super(...params);
    this.status = status;
  }
}
