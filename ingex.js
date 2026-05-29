const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const express = require('express');

// เซิร์ฟเวอร์หลอกสำหรับ Render
const app = express();
app.get('/', (req, res) => res.send('บอทออนไลน์และพร้อมใช้งานคำสั่งแล้ว!'));
app.listen(3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// กำหนด ID ของคุณ
const GUILD_ID = '1286146288584360047';
const CHANNEL_ID = '1418809861713428530';

// 1. สร้างคำสั่ง (Slash Commands)
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('เช็กความเร็วการตอบกลับของบอท'),
    new SlashCommandBuilder()
        .setName('join')
        .setDescription('สั่งให้บอทเข้าห้องเสียงค้างสาย'),
    new SlashCommandBuilder()
        .setName('leave')
        .setDescription('สั่งให้บอทออกจากห้องเสียง')
].map(command => command.toJSON());

client.on('ready', async () => {
    console.log(`${client.user.tag} ออนไลน์แล้ว!`);

    // 2. ลงทะเบียนคำสั่งเข้าเซิร์ฟเวอร์อัตโนมัติเมื่อบอทเปิดใช้งาน
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('กำลังลงทะเบียน Slash Commands...');
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, GUILD_ID),
            { body: commands }
        );
        console.log('ลงทะเบียน Slash Commands สำเร็จแล้ว!');
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลงทะเบียนคำสั่ง:', error);
    }

    // บอทเข้าห้องเสียงตอนเปิดเครื่องอัตโนมัติ
    connectToVoice();
});

// ฟังก์ชันเข้าห้องเสียง
function connectToVoice() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.error("หาห้องเสียงไม่เจอ");
    try {
        joinVoiceChannel({
            channelId: CHANNEL_ID,
            guildId: GUILD_ID,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        console.log('บอทสแตนด์บายในห้องเสียงแล้ว');
    } catch (e) {
        console.error(e);
    }
}

// 3. ระบบรอรับคำสั่งเมื่อมีคนพิมพ์คำสั่งใน Discord
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    // คำสั่ง /ping
    if (commandName === 'ping') {
        await interaction.reply(`🏓 พง! ความเร็วในการตอบกลับ: **${client.ws.ping}ms**`);
    }

    // คำสั่ง /join
    if (commandName === 'join') {
        connectToVoice();
        await interaction.reply('🎤 บอทเข้าสแตนด์บายในห้องเสียงเรียบร้อยครับ!');
    }

    // คำสั่ง /leave
    if (commandName === 'leave') {
        const connection = getVoiceConnection(GUILD_ID);
        if (connection) {
            connection.destroy();
            await interaction.reply('👋 บอทออกจากห้องเสียงเรียบร้อยครับ!');
        } else {
            await interaction.reply('❌ ตอนนี้บอทไม่ได้อยู่ในห้องเสียงครับ');
        }
    }
});

client.login(process.env.TOKEN);
      
