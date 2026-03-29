# Discord Bot - Message Sender & Audio Player

A Discord bot that can send messages to any channel and play audio in voice channels.

## Features

- Send messages to any channel in your server
- Join and leave voice channels
- Play audio files in voice channels
- Slash command support for easy interaction

## Prerequisites

- Node.js installed on your system
- A Discord account
- A Discord bot token (see setup below)

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the bot's username, click "Reset Token" and copy your bot token
5. Enable the following Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent (optional)
6. Go to the "OAuth2" tab, then "URL Generator"
7. Select the following scopes:
   - `bot`
   - `applications.commands`
8. Select the following bot permissions:
   - Send Messages
   - Connect
   - Speak
   - Use Voice Activity
9. Copy the generated URL and open it in your browser to invite the bot to your server

### 2. Configure the Bot

1. Open the `.env` file in the project root
2. Replace `your_discord_bot_token_here` with your actual bot token:
   ```
   DISCORD_TOKEN=your_actual_token_here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Bot

```bash
npm start
```

You should see: `Logged in as YourBotName#1234`

## Commands

The bot uses slash commands. Type `/` in Discord to see available commands:

### `/sendmsg`
Send a message to any channel.
- **channel**: Select the target channel
- **message**: Type the message you want to send

Example: `/sendmsg channel:#general message:Hello everyone!`

### `/join`
Make the bot join your current voice channel.

Example: `/join`

### `/leave`
Make the bot leave the voice channel.

Example: `/leave`

### `/play`
Play an audio file from the `./audio` folder.
- **file**: Name of the audio file (e.g., `song.mp3`)

Example: `/play file:song.mp3`

## Adding Audio Files

1. Place your audio files in the `audio` folder
2. Supported formats: MP3, WAV, OGG, FLAC, etc.
3. Use the `/play` command with the filename

Example structure:
```
project/
├── audio/
│   ├── song.mp3
│   ├── alert.wav
│   └── music.ogg
├── bot.js
└── .env
```

## Troubleshooting

### Bot doesn't respond to commands
- Make sure the bot is online and in your server
- Check that you've invited the bot with the correct permissions
- Verify the bot token in `.env` is correct

### Voice connection issues
- Ensure you're in a voice channel when using `/join`
- Check that the bot has "Connect" and "Speak" permissions
- Make sure your server region is supported

### Audio won't play
- Verify the audio file exists in the `./audio` folder
- Check the filename is correct (case-sensitive)
- Ensure the bot is connected to a voice channel (`/join` first)
- Check that FFmpeg is properly installed (it comes with ffmpeg-static package)

## Dependencies

- `discord.js` - Discord API library
- `@discordjs/voice` - Voice connection support
- `@discordjs/opus` - Audio encoding
- `libsodium-wrappers` - Encryption for voice
- `ffmpeg-static` - Audio processing
- `dotenv` - Environment variable management

## Notes

- Keep your bot token secret and never commit it to version control
- The bot needs to be in the server to send messages to channels
- Audio files should be in common formats (MP3, WAV, OGG)
- The bot can only be in one voice channel per server at a time
