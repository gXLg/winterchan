module.exports = async (bot, data, db) => {
  await bot.commandsResponse(data.id, data.token, {
    "embeds": [
      {
        "color": 0x85D9F2,
        "description":
          "**Winter Chan :snowflake:**\n" +
          "> Hello! :wave::relaxed:\n" +
          "> My name is Winter Chan :point_right::point_left:\n" +
          "> I was created for the [Snowcodes](https://www.snowcodes.org/) Hackathon\n" +
          "> I am a winter themed bot for your server. " +
          "I provide an interesting christmas based mini-games " +
          "for you and your friends to play, compete and have a nice time!\n" +
          "> There is a leaderboard, an interesting achievement system and a lot of fun included in the bot!\n"
          "> Also I really love hot chocolate! :yum::coffee:"
      }
    ]
  });
};