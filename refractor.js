process.env.CELL_MODE = process.env.NODE_ENV || process.env.CELL_MODE || "development";

var cwd = process.cwd();
if(process.argv[2] == "--") {
  process.chdir(__dirname);
}

var WebCell = require("organic-webcell/WebCell");
var instance = new WebCell(null, function(){
  instance.plasma.on("ExpressHttpPages", function(){
    if(process.argv[2] == "--") {
      process.chdir(cwd);
      instance.plasma.emit({
        type: "RenderPage",
        page: __dirname+"/pages/archconsole.jade"
      }, this, function(c){
        process.stdout.write(c.data);
      });
    }  
  })
});

