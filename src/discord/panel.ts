import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type BaseMessageOptions,
} from 'discord.js';

export const REGISTER_BUTTON_ID = 'wraith:register_button';

export function createRegistrationPanel(): BaseMessageOptions {
  const embed = new EmbedBuilder()
    .setTitle('🎃 Caça aos Doces — Halloween')
    .setDescription(
      'Bem-vindo ao evento de Halloween! Escolha entrar na disputa entre **Caçadores** e **Assombrações**.\n\n' +
        'O Caldeirão coletivo acumula todos os doces conquistados pela comunidade, liberando metas globais ao longo do mês.\n\n' +
        'Clique no botão abaixo para receber sua equipe balanceada automaticamente.'
    )
    .setColor(0xe67e22)
    .setFooter({ text: 'Project Wraith • Equipes fixas até o fim do evento' });

  const registerButton = new ButtonBuilder()
    .setCustomId(REGISTER_BUTTON_ID)
    .setLabel('Entrar no Evento')
    .setStyle(ButtonStyle.Success)
    .setEmoji('🍬');

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(registerButton);

  return {
    embeds: [embed],
    components: [actionRow],
  };
}