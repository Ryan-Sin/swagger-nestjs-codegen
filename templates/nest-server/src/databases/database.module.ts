import { Module } from '@nestjs/common';
import { {{{moduleOptions.variableType}}}Providers } from './{{{moduleOptions.database}}}.providers';

@Module({
  providers: [...{{{moduleOptions.variableType}}}Providers],
  exports: [...{{{moduleOptions.variableType}}}Providers],
})
export class {{{moduleOptions.variableType}}}Module {}
