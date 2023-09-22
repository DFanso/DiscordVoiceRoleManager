const Discord = require('discord.js');
const {GatewayIntentBits, MessageEmbed,EmbedBuilder } = Discord ;
const roleMemory = new Map();
require('dotenv').config() 


const client = new Discord.Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates
    ]
});


// Function to get roles that should be removed
function getRolesToBeRemoved(member, channelId) {
  const rolesToBeRemoved = [];

  // Define roles that should be removed when entering specific channels
  const removableRolesByChannel = {
    '1143240482785345737': ['1152349481229090957', '1152349462526693438'],
    //'VOICE_CHANNEL_ID_2': ['ROLE_ID_3', 'ROLE_ID_4'],
    // Add more channel-role mappings here
  };

  const removableRoles = removableRolesByChannel[channelId] || [];

  member.roles.cache.forEach((role) => {
    if (removableRoles.includes(role.id)) {
      rolesToBeRemoved.push(role.id);
    }
  });

  return rolesToBeRemoved;
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('voiceStateUpdate', (oldState, newState) => {
  console.log("Voice state update triggered");
    const oldChannelId = oldState.channel ? oldState.channel.id : null;
    const newChannelId = newState.channel ? newState.channel.id : null;

    // Handle joining a voice channel
    if (!oldState.channel && newState.channel) {
      const member = newState.member;
      const rolesToBeRemoved = getRolesToBeRemoved(member, newChannelId);
      
      console.log('Roles to be removed:', rolesToBeRemoved);  // Debug log
      
      roleMemory.set(member.id, rolesToBeRemoved);
      if (rolesToBeRemoved.length > 0) {  // Check if array is not empty
          member.roles.remove(rolesToBeRemoved).catch(console.error);
      }
  }

    // Handle leaving a voice channel
    if (oldState.channel && !newState.channel) {
      const member = oldState.member;
      const rolesToBeAddedBack = roleMemory.get(member.id);
      
      console.log('Roles to be added back:', rolesToBeAddedBack);  // Debug log
      
      if (rolesToBeAddedBack && rolesToBeAddedBack.length > 0) {  // Check if array is not empty
          member.roles.add(rolesToBeAddedBack).catch(console.error);
      }
      roleMemory.delete(member.id);
  }
});

client.login(process.env.BOT_TOKEN);
