import { Transaction } from 'sequelize/types';
import { ArenaPlayer } from '../../../../../../models';
import {
  addAmmoToItemInInventory,
  getPlayerItemCount,
} from '../../../../../../models/ArenaItemInventory';
import { findHealthkitByName } from '../../../../../../models/ItemHealthKit';
import { ITEM_TYPE } from '../../../../../consts/global';
import { MAX_PLAYER_HEALTH } from '../../../../consts';
import { publishArenaMessage } from '../../../../utils';
import { rarityWeight } from '../../../../utils/rollRarity';
import { gameEngineReply } from '../replies';

export async function aggressiveLoot(
  { killerPlayer, deadPlayer }: { killerPlayer: ArenaPlayer; deadPlayer: ArenaPlayer },
  transaction: Transaction
) {
  await killerPlayer.reloadFullInventory(transaction);
  await deadPlayer.reloadFullInventory(transaction);
  const orderedWeapons = deadPlayer._weapons?.sort((weaponA, weaponB) => {
    const weaponARarityWeight = rarityWeight(weaponA._itemRarityId);
    const weaponBRarityWeight = rarityWeight(weaponB._itemRarityId);
    return weaponARarityWeight - weaponBRarityWeight;
  });
  const bestWeapon = orderedWeapons?.pop();
  if (bestWeapon) {
    // check if weapon already exists
    const weaponQty = await getPlayerItemCount(
      { player: killerPlayer, item: bestWeapon },
      transaction
    );

    if (weaponQty > 0 && bestWeapon.usageLimit !== null) {
      // Add ammo to weapon when if exists
      const playerWeapon = killerPlayer._weapons?.find((w) => w.id === bestWeapon.id)!;
      await addAmmoToItemInInventory(
        {
          item: playerWeapon,
          player: killerPlayer,
          ammo: bestWeapon.ArenaItemInventory.remainingUses!,
        },
        transaction
      );
    } else {
      await killerPlayer.addWeapon(bestWeapon, transaction);
      if (bestWeapon.usageLimit !== null) {
        const ammoForNewWeapon =
          bestWeapon.ArenaItemInventory.remainingUses! - bestWeapon.usageLimit!;
        await killerPlayer.reloadFullInventory(transaction);
        await addAmmoToItemInInventory(
          {
            item: killerPlayer._weapons?.find((w) => w.id === bestWeapon.id)!,
            player: killerPlayer,
            ammo: ammoForNewWeapon,
          },
          transaction
        );
      }
    }
    await deadPlayer.removeWeapon(bestWeapon, transaction);
    await publishArenaMessage(
      gameEngineReply.playerLootAWeapon(
        killerPlayer._user?.slackId ?? '',
        bestWeapon.emoji,
        bestWeapon._itemRarityId,
        deadPlayer._user?.slackId ?? ''
      )
    );
  }

  const ZERO = 0;
  const healthKit = await findHealthkitByName(ITEM_TYPE.HEALTH_KIT, transaction);
  if (!healthKit) {
    return;
  }
  const deadPlayerHealthKitsQty = await deadPlayer.healthkitQty(healthKit.id);
  const killerPlayerHealthKitsQty = await killerPlayer.healthkitQty(healthKit.id);
  if (deadPlayerHealthKitsQty > ZERO) {
    if (killerPlayer.health < MAX_PLAYER_HEALTH) {
      await killerPlayer.reviveOrHeal(
        healthKit._healthkit?.healingPower ?? ZERO,
        MAX_PLAYER_HEALTH,
        transaction
      );
      await deadPlayer.subtractHealthkit(healthKit.id, deadPlayerHealthKitsQty, transaction);
      await publishArenaMessage(
        gameEngineReply.playerLootAHealthkit(killerPlayer, deadPlayer._user?.slackId!, true)
      );
    } else if (killerPlayerHealthKitsQty === ZERO) {
      // Saves it in the inventory
      await killerPlayer.addHealthkit(healthKit.id, deadPlayerHealthKitsQty, transaction);
      await deadPlayer.subtractHealthkit(healthKit.id, deadPlayerHealthKitsQty, transaction);
      await publishArenaMessage(
        gameEngineReply.playerLootAHealthkit(killerPlayer, deadPlayer._user?.slackId!, false)
      );
    }
  }
}
