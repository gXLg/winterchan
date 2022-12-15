const https = require("https");
const mimes = require("./mimes.json");

function request(options, limit, body, multipart){

  return new Promise(async (resolve, reject) => {

    // ratelimit handling
    let i = false;
    for(let bucket in limit){
      if(options.path in limit[bucket].paths){
        if(limit[bucket].remaining == 0){
          i = true;
          //while((new Date().valueOf() / 1000) < limit[bucket].reset){}
          await new Promise(r => setTimeout(r, limit[bucket].reset * 1000));
        }
        break;
      }
    }

    const req = https.request(options, res => {

      const buffer = [];
      res.on("data", data => buffer.push(data));
      res.on("end", () => {

        // ratelimit setup
        if(!i){
          if("x-ratelimit-bucket" in res.headers){
            const bucket = res.headers["x-ratelimit-bucket"];
            if(bucket in limit){
              limit[bucket].paths.push(options.path);
            } else {
              limit[bucket] = {
                "paths": [options.path],
              };
            }
            limit[bucket].remaining = parseInt(res.headers["x-ratelimit-remaining"]);
            limit[bucket].reset = parseFloat(res.headers["x-ratelimit-reset-after"]);
          }
        }

        const data = buffer.join("");
        if(data == "") resolve({ });
        else resolve(JSON.parse(data));
      });
    })

    req.on("error", error => {
      reject(error);
    });

    if(body)
      for(let part of body)
        req.write(part);
    req.end();

  });
}

// rest api request maker
// since will use this for discord,
// can simplify and use the same base url all the time
class Rest {

  limit = { };

  constructor(url, headers){
    const urlObject = new URL(url);
    this.hostname = urlObject.hostname;
    this.path = urlObject.pathname;
    headers["Content-Type"] = "application/json";
    this.headers = headers;
  }

  post(path, jsonBody){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "POST",
      "headers": this.headers
    };
    return request(options, this.limit, [JSON.stringify(jsonBody)]);
  }

  patch(path, jsonBody){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "PATCH",
      "headers": this.headers
    };
    return request(options, this.limit, [JSON.stringify(jsonBody)]);
  }

  put(path){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "PUT",
      "headers": this.headers
    };
    return request(options, this.limit);
  }

  get(path){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "GET",
      "headers": this.headers
    };
    return request(options, this.limit);
  }

  del(path){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "DELETE",
      "headers": this.headers
    };
    return request(options, this.limit);
  }

  postMultipart(path, jsonBody, files){
    const headers = {};
    for(let header in this.headers)
      headers[header] = this.headers[header];

    const body = [
      "Content-Disposition: form-data; " +
        "name=\"payload_json\"",
      "Content-Type: application/json",
      "",
      JSON.stringify(jsonBody)
    ].join("\n");

    const uploads = [];
    let index = 0;
    for(let file of files){

      //console.log(file.length);

      const filename = jsonBody.attachments[index].filename;
      const parts = filename.split(".");
      const type = parts[parts.length - 1];
      const mime = mimes[type] ?? "application/octet-stream";

      const data = [
        "Content-Disposition: form-data; " +
          "name=\"files[" + index + "]\"; " +
          "filename=\"" + filename + "\"",
        "Content-Type: " + mime,
        "",
        file
      ].join("\n");

      uploads.push(data);

      index ++;
    }

    const alpha = "0123456789abcdef";
    const text = [body, ...uploads].join("");

    function bound(b){
      let c = b ?? "";
      for(let d of alpha)
        if(!text.includes(c + d))
          return (c + d);
      for(let d of alpha){
        const r = bound(d + c);
        if(r) return r;
      }
      return false;
    }

    const boundary = bound();

    headers["Content-Type"] = "multipart/form-data; boundary=\"" + boundary + "\"";
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "POST",
      "headers": headers
    };

    return request(options, this.limit, [
      "--" + boundary + "\n" + body + "\r\n--" + boundary + "\n",
      Buffer.from(uploads.join("\r\n--" + boundary + "\n"), "binary"),
      "\r\n--" + boundary + "--"
    ]);
  }

}

module.exports = Rest;