import { findAdmin } from '../../../../models/User';

import { addEnemiesToFloor } from './actions/admin/tower-floors-operations';

export const addEnemies = async (floorNumber: number, enemyIds: number[]) => {
  const adminUser = await findAdmin();
  if (!adminUser) {
    return;
  }

  await addEnemiesToFloor(adminUser, floorNumber, enemyIds);
};