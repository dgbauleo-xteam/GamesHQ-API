import type { Association, FindOptions, Transaction } from 'sequelize';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Scopes,
  DefaultScope,
  Default,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';

import { USER_ROLE_NAME } from '../consts/model';
import { isScopeRole } from '../utils/permissions';

import { User } from './';

interface OrganizationAttributes {
  id: number;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  clientSecret: string;
  signingSecret: string;
}

interface OrganizationCreationAttributes {
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  clientSecret: string;
  signingSecret: string;
}

function withSensitiveData(): FindOptions {
  return {
    attributes: ['id', 'clientSecret', 'signingSecret'],
    include: [
      {
        model: User,
      },
    ],
  };
}

@DefaultScope(() => ({
  attributes: ['id', 'name', 'domain', 'isActive', 'createdAt'],
  include: [
    {
      model: User,
    },
  ],
}))
@Scopes(() => ({
  withSensitiveData,
  forRole(scope: string[]) {
    if (
      isScopeRole(scope, USER_ROLE_NAME.SUPER_ADMIN) ||
      isScopeRole(scope, USER_ROLE_NAME.ADMIN) ||
      isScopeRole(scope, USER_ROLE_NAME.COMMUNITY_TEAM)
    ) {
      return withSensitiveData();
    }
    return {};
  },
}))
@Table({
  indexes: [
    {
      unique: true,
      fields: ['name'],
    },
    {
      fields: ['domain'],
    },
  ],
})
export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  @BeforeCreate
  @BeforeUpdate
  static makeLowerCase(organizationInstance: Organization) {
    organizationInstance.name = organizationInstance.name.toLocaleLowerCase();
  }

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @Column(DataType.TEXT)
  name!: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  domain!: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive!: boolean;

  @Default(new Date())
  @Column(DataType.DATE)
  createdAt!: Date;

  @Column(DataType.TEXT)
  clientSecret!: string;

  @Column(DataType.TEXT)
  signingSecret!: string;

  @HasMany(() => User, '_organizationId')
  _users?: User[];

  static associations: {
    _users: Association<Organization, User>;
  };
}

export function findOrganizationByName(name: string, transaction?: Transaction) {
  return Organization.findOne({ where: { name }, transaction });
}
