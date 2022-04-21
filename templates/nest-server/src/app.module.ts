import { Module } from '@nestjs/common';
{{#each modules}} 
import { {{this}}Module} from './module/{{this}}.module';
{{/each}}

@Module({
  imports: [{{#each modules}} {{this}}Module, {{/each}}],
  controllers: [],
  providers: [],
})
export class AppModule {}
