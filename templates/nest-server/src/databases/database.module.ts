import { Module } from '@nestjs/common';
import { {{{options.variableType}}}Providers } from './{{{options.database}}}.providers';

@Module({
  providers: [...{{{options.variableType}}}Providers],
  exports: [...{{{options.variableType}}}Providers],
})
export class {{{options.variableType}}}Module {}
