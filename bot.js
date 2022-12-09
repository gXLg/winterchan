(async () => {

  // requiring without cache
  function require_(module){
    delete require.cache[require.resolve(module)];
    return require(module);
  }

  const fs = require("fs");
  const token = fs.readFileSync(".token", "UTF-8");

  const ds = require("./disnode");
  const bot = new ds.Bot(token);

  const me = await bot.user();
  console.log("Logging in as " + me.username + "...");
  const debugChannel = "751448682393763856";

  bot.listenOnce("READY", async data => {
    console.log("Bot logged in!");
    bot.setStatus({
      "status" : "online",
      "since" : 0,
      "afk" : false,
      "activities" : [{
        "name" : "building a snowman ⛄",
        "type" : 0 // PLAYING
      }]
    });

    await bot.sendMessage(debugChannel, {
      "content": "I am alive!"
    });
  });

  bot.listen("INTERACTION_CREATE", async data => {
    require_("./commands/" + data.data.name + ".js")(bot, data);
  });

  // intents = 0
  bot.login(0);

  // registering commands
  const commands = await bot.commands();
  const should = require("./commands/list.json");
  const compare = require("./functions/compare.js");
  for(const s of should){
    const same = commands.find(c => c.name == s.name);
    if(
      same &&
      Object.keys(s).every(k => compare(s[k], same[k]))
    ) continue;
    console.log("Registering command", s.name);
    await bot.registerCommand(s);
  }
  for(const c of commands){
    if(should.find(s => s.name == c.name)) continue;
    console.log("Removing old command", c.name);
    await bot.deleteCommand(c.id);
  }

})();