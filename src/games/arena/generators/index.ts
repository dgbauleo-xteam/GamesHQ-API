import { ArenaZone } from '../../../models';
import {
  SlackBlockKitCompositionOption,
  SlackBlockKitDividerLayout,
  SlackBlockKitLayoutElement,
  SlackBlockKitSelectMenuElement,
} from '../../model/SlackBlockKit';
import {
  blockKitAction,
  blockKitCompositionOption,
  blockKitMrkdwnSection,
  blockKitSelectMenu,
} from '../../utils/generators/slack';
import { ARENA_SECONDARY_ACTIONS } from '../consts';

export function generateChangeZonePickerBlock(
  hasChangeLocation: boolean,
  primaryMessageText: string,
  locations: ArenaZone[],
  currentLocation: ArenaZone
): SlackBlockKitLayoutElement[] {
  const blockKitDivider: SlackBlockKitDividerLayout = {
    type: 'divider',
  };
  const changeLocationMessageSection = blockKitMrkdwnSection(
    `Change Location ${currentLocation.emoji}`
  );

  const locationsToDropdownOptions: SlackBlockKitCompositionOption[] = locations.map((arenaZone) =>
    blockKitCompositionOption(`${arenaZone.emoji} ${arenaZone.name}`, `${arenaZone.id}`)
  );

  const slackChangeZonePickerMenu: SlackBlockKitSelectMenuElement = blockKitSelectMenu(
    ARENA_SECONDARY_ACTIONS.CHANGE_LOCATION,
    'Where to move after your action?',
    locationsToDropdownOptions
  );

  const actionLayout = blockKitAction([slackChangeZonePickerMenu]);

  const primaryMessageSection = [
    blockKitDivider,
    blockKitMrkdwnSection(primaryMessageText),
    blockKitDivider,
  ];
  const changeLocationSection = [blockKitDivider, changeLocationMessageSection, actionLayout];
  const fullBlockSection: SlackBlockKitLayoutElement[] = primaryMessageSection;
  if (hasChangeLocation) {
    fullBlockSection.push(...changeLocationSection);
  }
  return fullBlockSection;
}
