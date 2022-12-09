module.exports = async (bot, data) => {
  await bot.commandsResponse(data.id, data.token, {
    "embeds": [
      {
        "title": "Winter Chan :snowflake:",
        "color": 0x85D9F2,
        "description":
          "Hello! :wave::relaxed:\n" +
          "My name Winter Chan :point_right::point_left:\n" +
          "I was created for the [Snowcodes](https://www.snowcodes.org/) Hackathon\n" +
          "I am a winter themed bot for your server. " +
          "I provide an interesting christmas based mini-game " +
          "for you and your friends to play, compete and have a nice time!\n" +
          "Also I really love hot chocolate! :yum::coffee:"
      }
    ]
  });
};