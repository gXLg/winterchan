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

    await bot.sendMessage("751448682393763856", {
      "content": "I am alive!"
    });
  };

  // intents = 0
  bot.login(0);

})();