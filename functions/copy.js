function copy(obj){
  if(obj instanceof Object){
    if(obj instanceof Array){
      const n = [];
      for(const o of obj){
        n.push(copy(o));
      }
      return n;
    }
    const n = { };
    for(const key in obj){
      n[key] = copy(n[key]);
    }
    return n;
  }
  return obj;
}

module.exports = copy;