process.env.CELL_MODE = process.env.NODE_ENV || process.env.CELL_MODE || "development";

var WebCell = require("organic-webcell/WebCell");
var instance = new WebCell(null, function(){
  if(process.argv[2] == "--") {
    instance.plasma.emit({
      type: "RenderPage",
      page: __dirname+"/pages/archconsole.jade"
    }, this, function(c){
      console.log(c.data);
    });
  }
});

