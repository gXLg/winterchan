const fs = require("fs");

class Database {
  constructor(path){
    this.path = path;
    if(!fs.existsSync(path))
      fs.writeFileSync(path, "{ }");
    this.data = JSON.parse(fs.readFileSync(path));
    this.worker = [];
    this.id = 0;
  }
  entries(){
    return new Promise(async (res, rej) => {
      const id = [this.id ++, "pull"];
      this.worker.push(id);
      await this.wait(id);
      res([...Object.keys(this.data)]);
      this.worker.splice(0, 1);
    });
  }
  wait(id){
    return new Promise(res => {
      const i = setInterval(() => {
        if(this.worker.indexOf(id) == 0){
          clearInterval(i);
          res();
        }
      }, 0);
    });
  }
  pull(entry, expect){
    return new Promise(async (res, rej) => {
      const id = [this.id = (this.id + 1) % 65536, "pull"];
      this.worker.push(id);
      await this.wait(id);
      if(!(entry in this.data)){
        await this.#fill(entry, expect ?? { });
      }
      const data = this.data[entry];
      res(data);
      this.worker.splice(0, 1);
    });
  }
  del(entry){
    return new Promise(async (res, rej) => {
      const id = [this.id = (this.id + 1) % 65536, "put"];
      this.worker.push(id);
      await this.wait(id);
      delete this.data[entry];
      if(!this.worker.slice(1).map(w => w[1]).includes("put"))
        fs.writeFileSync(this.path, JSON.stringify(this.data));
      res();
      this.worker.splice(0, 1);
    });
  }
  put(entry, data){
    return new Promise(async (res, rej) => {
      const id = [this.id = (this.id + 1) % 65536, "put"];
      this.worker.push(id);
      await this.wait(id);
      this.data[entry] = data;
      if(!this.worker.slice(1).map(w => w[1]).includes("put"))
        fs.writeFileSync(this.path, JSON.stringify(this.data));
      res();
      this.worker.splice(0, 1);
    });
  }
  #fill(entry, data){
    return new Promise(async (res, rej) => {
      this.data[entry] = data;
      fs.writeFileSync(this.path, JSON.stringify(this.data));
      res();
    });
  }
}

module.exports = Database