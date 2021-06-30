import { Sequelize, Model } from 'sequelize-typescript';
import { prettify } from 'sql-log-prettifier';
import { getConfig, prettifyConfig } from './config';
import * as models from './models';
// tslint:disable-next-line:no-var-requires
const config = require('./config/database.js');

export interface AnyModel extends Model<AnyModel> {}
export type RawModel<M> = Pick<M, Exclude<keyof M, keyof AnyModel>> & { id: number | string };

export const sequelizeConfig = {
  ...config[getConfig('ENV')],
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  logging: (sql: string) => console.log(prettify(sql, prettifyConfig)),
};

export const sequelize = new Sequelize(sequelizeConfig);

export const initDb = async () => {
  sequelize.addModels(Object.values(models));
  await sequelize.authenticate();

  console.log('Connection to the database has been established successfully.');

  return sequelize;
};

export function getAllModels() {
  return sequelize.models;
}

export function getModelByName(name: string) {
  return getAllModels()[name];
}
