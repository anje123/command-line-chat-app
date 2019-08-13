const prompt = require("prompt");
const util = require("util");
const axios = require("axios");
const {JSDOM} = require("jsdom");
const {ChatManager, TokenProvider}  = require("@pusher/chatkit-client");
const readline = require("readline");
const logger = require('node-color-log');


const makeChatKitNodeCompatible = () => {
   const {window} =  new JSDOM()
   global.window = window
   global.navigator = {};
}

const createUser = async username => {
   try {
    await axios.post("http://localhost:3001/users",{
        username
    });
   } catch (error) {
       console.log(error);       
   }

}

const main = async() => {
    makeChatKitNodeCompatible();
  try {
    prompt.start();
    prompt.message = '';
    const get = util.promisify(prompt.get);

    const usernameSchema = {
      description: "Enter Username",
      name: "username",
      required: true
    }

    const {username} = await get(usernameSchema);
    await createUser(username);

    const chatManager = new ChatManager({
        instanceLocator: "v1:us1:2094f81b-ee9f-4585-8746-d726eb81001a",
        userId: username,
        tokenProvider: new TokenProvider({ url: "http://localhost:3001/authenticate" })
      });

      const currentUser = await chatManager.connect();
      const joinableRoom = await currentUser.getJoinableRooms();
      const avaliableRoom = [...currentUser.rooms,...joinableRoom];
      avaliableRoom.forEach((rooms,index)=>{
        logger.color("green").bold().log(`${index} - ${rooms.name}`);
      });

      const roomSchema = [{
        description: 'Join A Group Chat',
        name: 'chosenRoom',
        required: true
      }];

      const {chosenRoom} = await get(roomSchema);
      const room = avaliableRoom[chosenRoom];
      currentUser.subscribeToRoom({
        roomId: room.id,
        hooks: {
          onPresenceChanged: (state, user) => {
            logger.color('yellow').bold().log(`User ${user.name} is ${state.current}`)
                },
          onMessage: message => {
            logger.bold().log(`${message.senderId} - ${message.text}`);
          },
    
      
        },
        messageLimit: 5
      });

      const input = readline.createInterface({
        input: process.stdin
      });

      input.on("line", async text => {
        currentUser.sendSimpleMessage({
          roomId: room.id,
          text
        })

      });

    
    
    
  } catch (error) {
    logger.color('red').bold().log(`you logged out`)
    process.exit(1);     
  }

}
main();