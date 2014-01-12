var fs = require('fs');
var path = require("path");
var jade = require("jade");

module.exports = function(client, config) {
  client.bundle.transform(function(file){
    if (!/\.jade$/.test(file)) return client.through();

    var buffer = "";

    return client.through(function(chunk) {
      buffer += chunk.toString();
    },
    function() {
      var provideTranslation = "var t = $.t; ";

      try {
        var compiled = provideTranslation+"module.exports = " + jade.compile(buffer.toString(),{
          filename: file,
          client: true,
          compileDebug: config.debug || false
        }).toString().replace(/jade.debug/g,"debug").replace("debug", "var debug") + "\n";
        this.queue(compiled);
        this.queue(null);
      } catch(e){
        console.log(e, file);
      }
    });
  });
}