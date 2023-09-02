import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
{{#each modules}} 
import { {{domainNameClass}}Module} from './module/{{domainFrom}}.module';
{{/each}}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../src/config/.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    {{#each modules}} {{domainNameClass}}Module, {{/each}}],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('');
  }
}
