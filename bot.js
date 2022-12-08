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

  bot.events["READY"] = async data => {
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

    const testServer = "751448682393763856";
    await bot.sendMessage(testServer, {
      "content": "I am alive!"
    });
  };

  // intents = 0
  bot.login(0);

  const commands = await bot.commands();
  const should = require("./commands.json");
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
    if(
      should.find(s => s.name == c.name)
    ) continue;
    console.log("Removing old command", c.name);
    await bot.deleteCommand(c.id);
  }

})();