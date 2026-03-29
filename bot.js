const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const voiceConnections = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName('sendmsg')
    .setDescription('Send a message to a specific channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the message to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your current voice channel'),

  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel'),

  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play an audio file in voice channel')
    .addStringOption(option =>
      option.setName('file')
        .setDescription('Audio file name (place files in ./audio folder)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to DM')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user (mute)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration in minutes (max 40320)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get info about')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages from a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assign or remove a role from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to modify')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to assign or remove')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Add or remove the role')
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        )
        .setRequired(true)),
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) },
    );
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'sendmsg') {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    try {
      await channel.send(message);
      await interaction.reply({ content: `Message sent to ${channel}!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'join') {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return await interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      voiceConnections.set(interaction.guildId, connection);
      await interaction.reply({ content: `Joined ${voiceChannel.name}!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'leave') {
    const connection = voiceConnections.get(interaction.guildId);

    if (!connection) {
      return await interaction.reply({ content: 'Not in a voice channel!', ephemeral: true });
    }

    connection.destroy();
    voiceConnections.delete(interaction.guildId);
    await interaction.reply({ content: 'Left the voice channel!', ephemeral: true });
  }

  if (commandName === 'play') {
    const connection = voiceConnections.get(interaction.guildId);

    if (!connection) {
      return await interaction.reply({ content: 'Bot is not in a voice channel! Use /join first.', ephemeral: true });
    }

    const fileName = interaction.options.getString('file');
    const audioPath = path.join(__dirname, 'audio', fileName);

    try {
      const player = createAudioPlayer();
      const resource = createAudioResource(audioPath);

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Finished playing audio');
      });

      player.on('error', error => {
        console.error('Audio player error:', error);
      });

      await interaction.reply({ content: `Playing: ${fileName}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error playing audio: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'dm') {
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    try {
      await user.send(message);
      await interaction.reply({ content: `Message sent to ${user.tag}!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'ban') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return await interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    try {
      await interaction.guild.members.ban(user, { reason });
      await interaction.reply({ content: `Banned ${user.tag}. Reason: ${reason}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'kick') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return await interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    try {
      await member.kick(reason);
      await interaction.reply({ content: `Kicked ${user.tag}. Reason: ${reason}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'mute') {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return await interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    if (duration > 40320) {
      return await interaction.reply({ content: 'Duration must be 40320 minutes or less!', ephemeral: true });
    }

    try {
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.reply({ content: `Muted ${user.tag} for ${duration} minutes. Reason: ${reason}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'unmute') {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return await interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    try {
      await member.timeout(null);
      await interaction.reply({ content: `Unmuted ${user.tag}!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'warn') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    try {
      await user.send(`You have been warned in ${interaction.guild.name}. Reason: ${reason}`);
      await interaction.reply({ content: `Warned ${user.tag}. Reason: ${reason}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'userinfo') {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`User Info - ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Not in server', inline: true },
        { name: 'Roles', value: member ? member.roles.cache.map(r => r.toString()).join(', ') || 'None' : 'N/A' }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'purge') {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return await interaction.reply({ content: 'Amount must be between 1 and 100!', ephemeral: true });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Deleted ${deleted.size} messages!`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }

  if (commandName === 'role') {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const action = interaction.options.getString('action');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return await interaction.reply({ content: 'User not found in this server!', ephemeral: true });
    }

    try {
      if (action === 'add') {
        await member.roles.add(role);
        await interaction.reply({ content: `Added role ${role.name} to ${user.tag}!`, ephemeral: true });
      } else {
        await member.roles.remove(role);
        await interaction.reply({ content: `Removed role ${role.name} from ${user.tag}!`, ephemeral: true });
      }
    } catch (error) {
      await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
