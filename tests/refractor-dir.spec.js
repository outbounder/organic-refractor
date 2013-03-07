jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000;

describe("refractor", function(){
  var actions = require("../io-actions/refractor")({});
  var listedEntries;

  it("lists files depending on", function(next){
    actions["GET /folder"]({from: __dirname+"/data/inner/dir"}, function(err, files){
      expect(files.files.length).toBe(2);
      listedEntries = files;
      next();
    })
  })

  it("refractors dir", function(next){
    actions["POST /folder"]({
      from: __dirname+"/data/inner/dir", 
      to: __dirname+"/data/dir",
      entries: listedEntries
    }, function(err, files){
      expect(files.length).toBe(4);
      next();
    })
  })

  it("lists files depending on again", function(next){
    actions["GET /folder"]({from: __dirname+"/data/dir"}, function(err, files){
      expect(files.files.length).toBe(2);
      listedEntries = files;
      next();
    })
  })

  it("refractors dir back", function(next){
    actions["POST /folder"]({
      from: __dirname+"/data/dir", 
      to: __dirname+"/data/inner/dir",
      entries: listedEntries
    }, function(err, files){
      expect(files.length).toBe(4);
      next();
    })
  })
})
