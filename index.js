const Discord = require('discord.js');
const {GatewayIntentBits, MessageEmbed,EmbedBuilder } = Discord ;
const roleMemory = new Map();
require('dotenv').config() 


//roles
const Civilian = '1153856651149975612';
const Cadet = '1152349481229090957';
const Deputy = '1152349462526693438';
const Corporal = '1139162416635199639';
const Sergeant = '1152369046327664736';
const Lieutenant = '1139162408762478702';
const Captain = '1139162414869389322';


//channels
const Tac1 = '1143240380335263918';
const Tac2 = '1143240482785345737';
const Tac3 = '1143240554373726278';
const CivVC = '1154605603868651581';


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
    //Tac Channels
    '1143240380335263918': [Civilian], //Tac1
    '1143240482785345737': [Civilian,Cadet,Deputy,Corporal,Sergeant,Lieutenant,Captain], //Tac2
    '1143240554373726278': [Civilian,Cadet,Deputy,Corporal,Sergeant,Lieutenant,Captain], //Tac3

    //Civilian Channels
    '1154605603868651581': [Civilian,Cadet,Deputy,Corporal,Sergeant,Lieutenant,Captain], //Civilian-1
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

const pendingRoleRestoration = new Map();
const tacticalChannels = new Set([Tac1, Tac2, Tac3]);

client.on('voiceStateUpdate', (oldState, newState) => {
  console.log("Voice state update triggered");
  const oldChannelId = oldState.channel ? oldState.channel.id : null;
  const newChannelId = newState.channel ? newState.channel.id : null;

  const member = newState.member || oldState.member;

  let rolesToBeAddedBack = roleMemory.get(member.id) || [];
  

  // Handle leaving a voice channel or disconnecting
  if (oldChannelId && (oldChannelId !== newChannelId)) {
    if (!newChannelId) {  // Check if disconnecting
      setTimeout(() => {
        member.roles.add(rolesToBeAddedBack).catch(console.error);
        roleMemory.delete(member.id);  // Clear stored roles
      }, 3000);  // Wait for 3 seconds
    }
  }

  if (newChannelId && (newChannelId !== oldChannelId)) {
    const rolesToBeRemoved = getRolesToBeRemoved(member, newChannelId);

    let mergedRolesToBeRemoved = rolesToBeAddedBack;

    // Only merge roles if moving between tactical channels
    if (tacticalChannels.has(oldChannelId) || tacticalChannels.has(newChannelId)) {
      mergedRolesToBeRemoved = Array.from(new Set([...rolesToBeAddedBack, ...rolesToBeRemoved]));
    }

    // Update roleMemory with the merged roles
    roleMemory.set(member.id, mergedRolesToBeRemoved);

    if (rolesToBeRemoved.length > 0) {
      member.roles.remove(rolesToBeRemoved).catch(console.error);
    }
  }
});

client.login(process.env.BOT_TOKEN);
