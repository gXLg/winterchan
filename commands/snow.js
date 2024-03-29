function fieldToText(field){
  const d = {
    "tree": ":evergreen_tree:",
    "path": ":green_square:",
    "1snow": ":white_small_square:",
    "2snow": ":white_circle:",
    "carrot": ":carrot:",
    "player": ":slight_smile:",
    "kid": ":sleeping:",
    "wake": ":face_with_picking_eye:",
    "santa": ":santa:",
    "gift1": ":red_car:",
    "gift2": ":video_game:",
    "gift3": ":teddy_bear:",
    "gift4": ":izakaya_lantern:",
    "happy": ":star_struck:",
    "wall": ":house:",
    "way": ":white_medium_square:"
  };

  const rows = [];
  for(const row of field){
    rows.push(row.map(i => d[i]).join(""));
  }
  return rows.join("\n");
}

function createFieldSnowman(){
  while(true){
    const field = [...new Array(10)].map(
      r => [...new Array(10)].map(
        i => "tree"
      )
    );
    const path = [];
    for(let y = 1; y < 9; y ++){
      for(let x = 1; x < 9; x ++){
        if(x == 3 && [3, 6].includes(y)) continue;
        if(x == 6 && [3, 6].includes(y)) continue;
        field[y][x] = "path";
        if(x > 1 && x < 8)
          if(y > 1 && y < 8)
            path.push([x, y]);
      }
    }
    for(let i = 0; i < 6; i ++){
      const [x, y] = path.splice(
        Math.random() * path.length, 1
      )[0];
      field[y][x] = "1snow";
    }
    const [x, y] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[y][x] = "carrot";
    let [px, py] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[py][px] = "player";

    if(
      field[py + 1][px] == "path" ||
      field[py - 1][px] == "path" ||
      field[py][px + 1] == "path" ||
      field[py][px - 1] == "path"
    ){
      return [field, px, py];
    }
  }
  return [];
}

function createFieldKids(){
  while(true){
    const field = [...new Array(10)].map(
      r => [...new Array(10)].map(
        i => "wall"
      )
    );
    const path = [];
    for(let y = 1; y < 9; y ++){
      for(let x = 1; x < 9; x ++){
        if(x == 3 && [3, 6].includes(y)) continue;
        if(x == 6 && [3, 6].includes(y)) continue;
        field[y][x] = "way";
        path.push([x, y]);
      }
    }
    let x, y;
    const k = [];
    for(let i = 0; i < 4; i ++){
      [x, y] = path.splice(
        Math.random() * path.length, 1
      )[0];
      field[y][x] = "kid";
      k.push(x * 10 + y);
    }
    [x, y] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[y][x] = "gift1";
    [x, y] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[y][x] = "gift2";
    [x, y] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[y][x] = "gift3";
    [x, y] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[y][x] = "gift4";


    let [px, py] = path.splice(
      Math.random() * path.length, 1
    )[0];
    field[py][px] = "santa";

    if(
      field[py + 1][px] == "way" ||
      field[py - 1][px] == "way" ||
      field[py][px + 1] == "way" ||
      field[py][px - 1] == "way"
    ){
      return [field, px, py, ...k];
    }
  }
  return [];
}

const buttons = [
  {
    "type": 1,
    "components": [
      {
        "type": 2,
        "custom_id": "button_back",
        "style": 1,
        "emoji": { "name": "↩" },
        "disabled": true
      },
      {
        "type": 2,
        "custom_id": "button_up",
        "style": 1,
        "emoji": { "name": "⬆" }
      },
      {
        "type": 2,
        "custom_id": "button_reset",
        "style": 1,
        "emoji": { "name": "🔄" }
      },
      {
        "type": 2,
        "custom_id": "button_close",
        "style": 1,
        "emoji": { "name": "🚫" }
      }
    ]
  },
  {
    "type": 1,
    "components": [
      {
        "type": 2,
        "custom_id": "button_left",
        "style": 1,
        "emoji": { "name": "⬅" }
      },
      {
        "type": 2,
        "custom_id": "button_down",
        "style": 1,
        "emoji": { "name": "⬇" }
      },
      {
        "type": 2,
        "custom_id": "button_right",
        "style": 1,
        "emoji": { "name": "➡" }
      },
      {
        "type": 2,
        "custom_id": "button_new",
        "style": 1,
        "emoji": { "name": "🔥" }
      }
    ]
  }
];
const start = [
  {
    "type": 1,
    "components": [
      {
        "type": 2,
        "custom_id": "button_new",
        "style": 1,
        "emoji": { "name": "🎌" }
      }
    ]
  }
];

async function snowman(bot, data, db){
  const field = [];
  let ppx, ppy, px, py, lx, ly;
  const startField = [];
  const lastField = [];
  let steps = 0;
  let redos = 0;
  let score = 200;

  await bot.commandsResponse(data.id, data.token, {
    "embeds": [
      {
        "color": 0x85D9F2,
        "description":
          "**Game :thinking:**\n" +
          "> This time you should create a snowman! :snowman:\n" +
          "> \n" +
          "> Move around using arrow buttons - :arrow_left::arrow_up::arrow_down::arrow_right:\n" +
          "> Return one last step - :leftwards_arrow_with_hook:\n" +
          "> Start again - :arrows_counterclockwise:\n" +
          "> New board - :fire:\n" +
          "> Stop playing - :no_entry_sign:\n" +
          "> \n" +
          "> Push together two small snow layers to create one big snowball, " +
          "place three big snowballs upon each other and a carrot right to the top one to create a snowman!\n" +
          "> Game times out after 15 minutes and the score gets discarded.\n" +
          "> Press the button to start the game :innocent:"
      }
    ],
    "components": start
  });
  const message = await bot.commandsGetResponse(data.token);

  let lastToken = data.token;
  let lastId = data.id;
  while(true){
    const prom = bot.listenOnce(
      "INTERACTION_CREATE", null,
      d => d.type == 3 &&
      (d.user ?? d.member.user).id ==
      (data.user ?? data.member.user).id &&
      d.message.id == message.id,
      10 * 60 * 1000
    );
    const react = await prom;
    if(prom.status.timedout){
      await bot.commandsEditResponse(lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Snow :snowflake:**\n" +
              "> Session timed out after 10 minutes of inactivity :stopwatch:. Your score was not saved :pensive:"
          }
        ],
        "components": []
      });
      break;
    }
    lastToken = react.token;
    lastId = react.id;
    const id = react.data.custom_id;
    steps ++;
    score = Math.max(0, score - 1);
    if(id == "button_back"){
      redos ++;
      steps --;
      buttons[0].components[0].disabled = true;
      if(lastField.length) field.splice(0, 10);
      px = lx;
      py = ly;
      lastField.forEach(r => field.push([...r]));
    } else if(id == "button_reset"){
      redos = 0;
      steps = 0;
      score = Math.min(200, score + 15);
      buttons[0].components[0].disabled = true;
      field.splice(0, 10);
      px = ppx;
      py = ppy;
      startField.forEach(r => field.push([...r]));
    } else if(id == "button_close"){
        await bot.commandsComResponse(lastId, lastToken, {
          "embeds": [
            {
              "color": 0x85D9F2,
              "description":
                "**Snow :snowflake:**\n" +
                "> Game stopped"
            }
          ],
          "components": []
        });
        break;
    } else if(id == "button_new"){
      const [ffield, pppx, pppy] = createFieldSnowman();
      field.splice(0, 10);
      ffield.forEach(r => field.push([...r]));
      ppx = pppx;
      ppy = pppy;
      px = ppx;
      py = ppy;
      startField.splice(0, 10);
      field.forEach(r => startField.push([...r]))
      lastField.splice(0, 10);
      lx = px;
      ly = py;
      steps = 0;
      redos = 0;
      score = 200;
      buttons[0].components[0].disabled = true;
    } else {
      buttons[0].components[0].disabled = false;
      let d;
      if(id == "button_up") d = [0, -1];
      if(id == "button_down") d = [0, 1];
      if(id == "button_left") d = [-1, 0];
      if(id == "button_right") d = [1, 0];
      const [x, y] = d;
      const [ex, ey] = [px + x, py + y];
      const [eex, eey] = [px + x + x, py + y + y];
      let last = true;
      if(field[ey][ex] == null || field[ey][ex] == "tree"){
        last = false;
      } else {
        if(field[ey][ex] == "path"){
          field[ey][ex] = "player";
          field[py][px] = "path";
        } else if(
          field[ey][ex] == "2snow" || field[ey][ex] == "carrot"
        ){
          if(field[eey][eex] == "path"){
            field[eey][eex] = field[ey][ex];
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else {
            last = false;
          }
        } else if(field[ey][ex] == "1snow"){
          if(field[eey][eex] == "path"){
            field[eey][eex] = "1snow";
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else if(field[eey][eex] == "1snow"){
            field[eey][eex] = "2snow";
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else {
            last = false;
          }
        }
      }
      if(last){
        lastField.splice(0, 10);
        field.forEach(r => lastField.push([...r]));
        lx = px;
        ly = py;
        px = ex;
        py = ey;
      }
    }
    let cx;
    let cy;
    let f = false;
    for(let y = 1; y < 9; y ++){
      for(let x = 1; x < 9; x ++){
        if(field[y][x] == "carrot"){
          cx = x;
          cy = y;
          f = true;
          break;
        }
      }
      if(f) break;
    }
    if(
      field[cy][cx - 1] == "2snow" &&
      field[cy + 1][cx - 1] == "2snow" &&
      field[cy + 2][cx - 1] == "2snow"
    ){
      await bot.commandsComResponse(lastId, lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Snow :snowflake:**\n" +
              ">          :grin: :snowman:\n" +
              "> Yay! You built a snowman!\n" +
              ">  Steps: " + steps + "  Redos: " + redos + "  Score: " + score
          }
        ],
        "components": []
      });
      const id = (data.user ?? data.member.user).id;
      const player = await db.pull(id, [0, []]);
      player[0] += score;
      await db.put(id, player);
      break;
    } else {
      await bot.commandsComResponse(lastId, lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Game :thinking:**\n" +
              "> This time you should create a snowman! :snowman:\n\n" +
              "**Board**\n" +
              fieldToText(field)
          }
        ],
        "components": buttons
      });
    }
  }
}

async function kids(bot, data, db){
  const field = [];
  let ppx, ppy, px, py, lx, ly;
  const startField = [];
  const lastField = [];
  let steps = 0;
  let redos = 0;
  let inventory = null;
  let timer = 0;
  let score = 200;
  const kids = { };
  let linv, ltime;

  await bot.commandsResponse(data.id, data.token, {
    "embeds": [
      {
        "color": 0x85D9F2,
        "description":
          "**Game :thinking:**\n" +
          "> This time you are Santa and should bring kids their presents! :gift:\n" +
          "> \n" +
          "> Move around using arrow buttons - :arrow_left::arrow_up::arrow_down::arrow_right:\n" +
          "> Return one last step - :leftwards_arrow_with_hook:\n" +
          "> Start again - :arrows_counterclockwise:\n" +
          "> New board - :fire:\n" +
          "> Stop playing - :no_entry_sign:\n" +
          "> \n" +
          "> Walk onto a gift to pick it up and to drop current if holding something, " +
          "move near a kid to drop the gift!\n" +
          "> A timer will count from 5 to 0 with each step and move to 5 again after it reaches 0.\n" +
          "> When the timer reaches 0, all kids are going wake up and check their present.\n" +
          "> If it is what they wanted, they will take it and become happy.\n" +
          "> Else, you have to take the present and give it to another kid.\n" +
          "> You should not be in radius of 2 blocks from a kid when they wake up or else they will see you.\n" +
          "> Game times out after 15 minutes and the score gets discarded.\n" +
          "> Press the button to start the game :innocent:"
      }
    ],
    "components": start
  });
  const message = await bot.commandsGetResponse(data.token);

  let lastToken = data.token;
  let lastId = data.id;
  while(true){
    const prom = bot.listenOnce(
      "INTERACTION_CREATE", null,
      d => d.type == 3 &&
      (d.user ?? d.member.user).id ==
      (data.user ?? data.member.user).id &&
      d.message.id == message.id,
      10 * 60 * 1000
    );
    const react = await prom;
    if(prom.status.timedout){
      await bot.commandsEditResponse(lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Snow :snowflake:**\n" +
              "> Session timed out after 10 minutes of inactivity :stopwatch:. Your score was not saved :pensive:"
          }
        ],
        "components": []
      });
      break;
    }
    lastToken = react.token;
    lastId = react.id;
    const id = react.data.custom_id;
    steps ++;
    score = Math.max(0, score - 1);
    if(id == "button_back"){
      redos ++;
      steps --;
      buttons[0].components[0].disabled = true;
      if(lastField.length) field.splice(0, 10);
      px = lx;
      py = ly;
      lastField.forEach(r => field.push([...r]));
      inventory = linv;
      timer = ltime;
    } else if(id == "button_reset"){
      redos = 0;
      steps = 0;
      score = Math.min(200, score + 15);
      inventory = null;
      timer = 0;
      buttons[0].components[0].disabled = true;
      field.splice(0, 10);
      px = ppx;
      py = ppy;
      startField.forEach(r => field.push([...r]));
      linv = null;
      ltime = 0;
    } else if(id == "button_close"){
        await bot.commandsComResponse(lastId, lastToken, {
          "embeds": [
            {
              "color": 0x85D9F2,
              "description":
                "**Snow :snowflake:**\n" +
                "> Game stopped"
            }
          ],
          "components": []
        });
        break;
    } else if(id == "button_new"){
      const [ffield, pppx, pppy, a, b, c, d] = createFieldKids();
      field.splice(0, 10);
      ffield.forEach(r => field.push([...r]));
      ppx = pppx;
      ppy = pppy;
      px = ppx;
      py = ppy;
      startField.splice(0, 10);
      field.forEach(r => startField.push([...r]))
      lastField.splice(0, 10);
      lx = px;
      ly = py;
      steps = 0;
      redos = 0;
      score = 200;
      inventory = null;
      timer = 0;
      let p = 1;
      for(const kid in kids)
        delete kids[kid];
      for(const kid of [a, b, c, d]){
        kids[kid] = "gift" + p;
        p ++;
      }
      linv = null;
      ltime = 0;
      buttons[0].components[0].disabled = true;
    } else {
      timer = (timer + 5) % 6;
      buttons[0].components[0].disabled = false;
      let d;
      if(id == "button_up") d = [0, -1];
      if(id == "button_down") d = [0, 1];
      if(id == "button_left") d = [-1, 0];
      if(id == "button_right") d = [1, 0];
      const [x, y] = d;
      const [ex, ey] = [px + x, py + y];
      const [eex, eey] = [px + x + x, py + y + y];
      let last = true;
      if(inventory){
        
      }
      if(field[ey][ex] == null || field[ey][ex] == "wall"){
        last = false;
      } else {
        if(field[ey][ex] == "path"){
          field[ey][ex] = "player";
          field[py][px] = "path";
        } else if(
          field[ey][ex] == "2snow" || field[ey][ex] == "carrot"
        ){
          if(field[eey][eex] == "path"){
            field[eey][eex] = field[ey][ex];
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else {
            last = false;
          }
        } else if(field[ey][ex] == "1snow"){
          if(field[eey][eex] == "path"){
            field[eey][eex] = "1snow";
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else if(field[eey][eex] == "1snow"){
            field[eey][eex] = "2snow";
            field[ey][ex] = "player";
            field[py][px] = "path";
          } else {
            last = false;
          }
        }
      }
      if(last){
        lastField.splice(0, 10);
        field.forEach(r => lastField.push([...r]));
        lx = px;
        ly = py;
        px = ex;
        py = ey;
      }
    }
    /*let cx;
    let cy;
    let f = false;
    for(let y = 1; y < 9; y ++){
      for(let x = 1; x < 9; x ++){
        if(field[y][x] == "carrot"){
          cx = x;
          cy = y;
          f = true;
          break;
        }
      }
      if(f) break;
    }
    if(
      field[cy][cx - 1] == "2snow" &&
      field[cy + 1][cx - 1] == "2snow" &&
      field[cy + 2][cx - 1] == "2snow"
    ){
      await bot.commandsComResponse(lastId, lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Snow :snowflake:**\n" +
              ">          :grin: :snowman:\n" +
              "> Yay! You made all kids happy!\n" +
              ">  Steps: " + steps + "  Redos: " + redos + "  Score: " + score
          }
        ],
        "components": []
      });
      const id = (data.user ?? data.member.user).id;
      const player = await db.pull(id, [0, []]);
      player[0] += score;
      await db.put(id, player);
      break;
    } else {*/
      const t = ["zero", "one", "two", "three", "four", "five"];
      await bot.commandsComResponse(lastId, lastToken, {
        "embeds": [
          {
            "color": 0x85D9F2,
            "description":
              "**Game :thinking:**\n" +
              "> This time you are Santa! :gift:\n" +
              "**Santa Data :bar_chart:**\n" +
              "> Current gift: " + (inventory ?? "[]") + "  Sleep Timer: :" + t[timer] + ":\n\n" +
              "**Board**\n" +
              fieldToText(field)
          }
        ],
        "components": buttons
      });
    //}
  }
}

// more games:
// * memory

module.exports = async (bot, data, db) => {
  //const games = [snowman, kids];
  const games = [kids];
  const game = games[Math.floor(Math.random() * games.length)];
  await game(bot, data, db);
};
