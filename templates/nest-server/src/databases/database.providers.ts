{{#if (checkTypeORM options.orm)}}
import { DataSource } from 'typeorm';

export const {{{options.variableType}}}Providers = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const AppDataSource = new DataSource({
        type: '{{{options.database}}}',
        host: process.env.MYSQL_MASTER_HOST,
        port: parseInt(process.env.MYSQL_MASTER_PORT),
        username: process.env.MYSQL_MASTER_USER,
        password: process.env.MYSQL_MASTER_PASSWORD,
        database: process.env.MYSQL_MASTER_DATABASE,
        bigNumberStrings: false,
        entities: ['dist/**/*.entity.{ts,js}'], // Entity 연결
        logging: process.env.NODE_ENV === 'local' ? true : false,
      });

      return AppDataSource.initialize().then();
    },
  },
];
{{else if (checkSequelize options.orm)}}
import { Sequelize } from 'sequelize-typescript';

export const {{{options.variableType}}}Providers = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: '{{{options.database}}}',
        host: process.env.MYSQL_MASTER_HOST,
        port: parseInt(process.env.MYSQL_MASTER_PORT),
        username: process.env.MYSQL_MASTER_USER,
        password: process.env.MYSQL_MASTER_PASSWORD,
        database: process.env.MYSQL_MASTER_DATABASE,
      });
      sequelize.addModels();
      await sequelize.sync();
      return sequelize;
    },
  },
];
{{else if (checkMongoose options.orm)}}
import * as mongoose from 'mongoose';

export const {{{options.variableType}}}Providers = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(`mongodb://${process.env.MYSQL_MASTER_HOST}:27017`),
  },
];
{{else}}
{{/if}}
