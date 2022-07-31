{{#if (checkTypeORM moduleOptions.orm)}}
import { DataSource } from 'typeorm';

export const {{{moduleOptions.variableType}}}Providers = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const AppDataSource = new DataSource({
        type: '{{{moduleOptions.database}}}',
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
{{else if (checkSequelize moduleOptions.orm)}}
import { Sequelize } from 'sequelize-typescript';

export const {{{moduleOptions.variableType}}}Providers = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      const sequelize = new Sequelize({
        dialect: '{{{moduleOptions.database}}}',
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
{{else if (checkMongoose moduleOptions.orm)}}
import * as mongoose from 'mongoose';

export const {{{moduleOptions.variableType}}}Providers = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(        
        `mongodb://${
          process.env.MONGO_MASTER_HOST
        }:${
          process.env.MONGO_MASTER_PORT
        }/`,
        {
          dbName: process.env.MONGO_MASTER_DATABASE,
          user: process.env.MONGO_MASTER_USER,
          pass: process.env.MONGO_MASTER_PASSWORD,
        },
      ),
  },
];
{{else}}
{{/if}}
