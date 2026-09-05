import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
  type InteractionReplyOptions,
} from 'discord.js';

export const PANEL_BUTTON_ID = 'wraith:foundation:status';

export function createFoundationPanel(): InteractionReplyOptions {
  const actions = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(PANEL_BUTTON_ID)
      .setLabel('Verificar presença')
      .setStyle(ButtonStyle.Primary),
  );

  const container = new ContainerBuilder()
    .setAccentColor(0x7c3aed)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '# Project Wraith\nA fundação está desperta. Use o botão para testar a interação.',
      ),
    )
    .addActionRowComponents(actions);

  return {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  };
}
