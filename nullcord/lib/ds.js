const Rest = require("./rest.js");
const TimePromise = require("./timepromise.js");
const { WebSocket } = require("ws");

class Bot {

  cache = { };
  sequence = null;
  on = [];
  once = [];
  destroyed = false;
  error = false;

  constructor(token){
    this.token = token;
    this.rest = new Rest(
      "https://discord.com/api/v9",
      { "Authorization": "Bot " + token }
    );
  }

  // for getting user info without logging in
  async user(){
    return this.cache.user ?? (
      this.cache.user = await this.rest.get("/users/@me")
    );
  }

  // getting a list of all commands
  async commands(){
    const user = await this.user();
    return this.cache.commands ?? (
      this.cache.commands = await this.rest.get("/applications/" + user.id + "/commands")
    );
  }

  // register a command
  async registerCommand(command){
    const user = await this.user();
    const commands = await this.commands();
    const result = await this.rest.post("/applications/" + user.id + "/commands", command);
    const same = commands.find(c => c.id == result.id);
    if(same) this.cache.commands[commands.indexOf(same)] = result;
    return result;
  }

  // delete a command
  async deleteCommand(id){
    const user = await this.user();
    const commands = await this.commands();
    const result = await this.rest.del("/applications/" + user.id + "/commands/" + id);
    this.cache.commands = commands.filter(c => c.id != id);
    return result;
  }

  // getting a list of all guild commands
  async guildCommands(gid){
    const user = await this.user();
    if(!this.cache.guildCommands)
      this.cache.guildCommands = {};
    return this.cache.guildCommands[gid] ?? (
      this.cache.guildCommands[gid] = await this.rest.get("/applications/" + user.id + "/guilds/" + gid + "/commands")
    );
  }

  // register a guild command
  async registerGuildCommand(gid, command){
    const user = await this.user();
    const commands = await this.guildCommands(gid);
    const result = await this.rest.post("/applications/" + user.id + "/guilds/" + gid + "/commands", command);
    const same = commands.find(c => c.id == result.id);
    if(same) this.cache.guildCommands[gid][commands.indexOf(same)] = result;
    return result;
  }

  // delete a guild command
  async deleteGuildCommand(gid, id){
    const user = await this.user();
    const commands = await this.guildCommands(gid);
    const result = await this.rest.del("/applications/" + user.id + "/guilds/" + gid + "/commands/" + id);
    this.cache.guildCommands[gid] = commands.filter(c => c.id != id);
    return result;
  }

  // login, creates a websocket connection to the gateway
  async login(intents){

    // receiving the gateway endpoint
    const gateway = await this.rest.get("/gateway/bot");
    const sessions = gateway.session_start_limit;
    if(sessions.remaining == 0)
      throw new Error("Session limit reached, reset after " + sessions.reset_after);

    const url = new URL(gateway.url);
    url.searchParams.set("v", 10);
    url.searchParams.set("encoding", "json");

    function connect(bot, resume){

      bot.recon = true;

      bot.ws = new WebSocket(url.href);
      bot.ws.on("message", data => {
        const payload = JSON.parse(data);

        //console.log(data.toString());

        if(payload.s) bot.sequence = payload.s;

        // heartbeat setup to keep the bot alive
        const sendHeartbeat = ( ) => bot.ws.send(JSON.stringify({
          "op": 1,
          "d": bot.sequence
        }));
        if(payload.op == 1) sendHeartbeat();

        if(payload.op == 10){
          sendHeartbeat();
          bot.heart = setInterval(sendHeartbeat, payload.d.heartbeat_interval);

          if(resume){
            // if discord asked to reconnect
            console.debug("Sending resume payload");
            const resume = JSON.stringify({
              "op": 6,
              "d": {
                "token": bot.token,
                "session_id": bot.sessionId,
                "seq": bot.sequence
              }
            });
            bot.ws.send(resume);
          } else {
            console.debug("Sending identify payload");
            const identify = JSON.stringify({
              "op": 2,
              "d": {
                intents,
                "token": bot.token,
                "properties": {
                  "$os": "linux",
                  "$browser": "node.js",
                  "$device": "calculator"
                }
              }
            });
            bot.ws.send(identify);
          }

        } else if(payload.op == 9){
          console.debug("Discord asked to close and exit");
          bot.recon = false;
          //bot.ws.close();
          //throw new Error("Invalid session!");

        } else if(payload.op == 7){
          console.debug("Discord asked to reconnect");
          //bot.ws.close();

        } else if(payload.op == 0){
          //console.log("Event was dispatched", payload.t);
          if(payload.t == "READY") bot.sessionId = payload.d.session_id;

          // if there is a listener, then use it
          for(const listener of bot.on){
            if(listener.event == payload.t){
              listener.run(payload.d);
            }
          }

          // event listeners for single event
          // can be used with some filter, and timeout
          bot.once = bot.once.filter(listener => {
            if(listener.status.timedout) return false;
            if(listener.event != payload.t) return true;
            if(listener.filter)
              if(!listener.filter(payload.d)) return true;
            listener.run?.(payload.d);
            listener.resolve(payload.d);
            return false;
          });
        }
      });
      bot.ws.on("close", code => {
        clearInterval(bot.heart);
        console.debug("WebSocket closed with status", code);
        if(!bot.destroyed){
          console.debug("Trying to " + (bot.recon ? "re" : "") + "connect");
          if(bot.error)
            console.debug("Error happened, waiting 10 seconds...");
          setTimeout(() => connect(bot, bot.recon), bot.error ? 10000 : 10);
          bot.error = false;
        }
      });
      bot.ws.on("error", error => {
        //throw new Error(error);
        console.error("Error:", error.message);
        bot.error = true;
      });
    }
    connect(this, false);
  }

  destroy(){
    this.destroyed = true;
    this.ws.close(1000);
  }

  // answer to slash command, that will respond later
  commandsDeferred(id, token){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      { "type": 5 }
    );
  }

  // answer to slash command directly
  commandsResponse(id, token, message){
  return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      { "type": 4, "data": message }
    );
  }

  // get original response message
  commandsGetResponse(token){
    return this.rest.get(
        "/webhooks/" + this.cache.user.id + "/" + token + "/messages/@original"
    );
  }

  // answer to button press, that will respond later
  commandsDeferredWithCom(id, token){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      { "type": 6 }
    );
  }

  // answer to button press directly
  commandsComResponse(id, token, message){
    return this.rest.post(
      "/interactions/" + id + "/" + token + "/callback",
      { "type": 7, "data": message }
    );
  }

  // edit the message, both for slash and button
  commandsEditResponse(token, message){
    return this.rest.patch(
        "/webhooks/" + this.cache.user.id + "/" + token + "/messages/@original",
        message
    );
  }

  sendMessage(channelId, message){
    return this.rest.post(
      "/channels/" + channelId + "/messages",
      message
    );
  };

  editMessage(channelId, messageId, message){
    return this.rest.patch(
      "/channels/" + channelId + "/messages/" + messageId,
      message
    );
  }

  deleteMessage(channelId, messageId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId
    );
  }

  setStatus(status){
    this.ws.send(JSON.stringify({
      "op": 3,
      "d": status
    }));
  }

  react(channelId, messageId, reaction){
    return this.rest.put(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction) + "/@me"
    );
  }

  deleteReaction(channelId, messageId, reaction){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction)
    );
  }

  deleteAllReactions(channelId, messageId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions"
    );
  }

  deleteReactionUser(channelId, messageId, reaction, userId){
    return this.rest.del(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction) + "/" + userId
    );
  }

  getReactions(channelId, messageId, reaction){
    return this.rest.get(
      "/channels/" + channelId + "/messages/" + messageId +
      "/reactions/" + encodeURI(reaction)
    );
  }

  addUserRole(guildId, userId, roleId){
    return this.rest.put(
      "/guilds/" + guildId + "/members/" + userId +
      "/roles/" + roleId
    );
  }

  // static listener
  listen(event, run){
    this.on.push({ event, run });
  }

  // add one time listener
  listenOnce(event, run, filter, timeout){
    return new TimePromise((resolve, reject, status) => {
      this.once.push({event, run, filter, timeout, resolve, status});
    }, timeout);
  }

}

module.exports = { Bot };