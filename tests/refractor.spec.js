jasmine.DEFAULT_TIMEOUT_INTERVAL = 25000;

describe("refractor", function(){
  var actions = require("../io-actions/refractor")({});
  var listedEntries;

  it("lists files depending on", function(next){
    actions["GET"]({from: __dirname+"/data/test-dep1.js"}, function(err, files){
      expect(files.length).toBe(2);
      listedEntries = files;
      next();
    })
  })

  it("refractors files", function(next){
    actions["POST"]({
      from: __dirname+"/data/test-dep1.js", 
      to: __dirname+"/data/inner/test-dep1.js",
      entries: listedEntries
    }, function(err, files){
      expect(files.length).toBe(2);
      next();
    })
  })

  it("lists files depending on again", function(next){
    actions["GET"]({from: __dirname+"/data/inner/test-dep1.js"}, function(err, files){
      expect(files.length).toBe(2);
      listedEntries = files;
      next();
    })
  })

  it("refractors files back", function(next){
    actions["POST"]({
      from: __dirname+"/data/inner/test-dep1.js", 
      to: __dirname+"/data/test-dep1.js",
      entries: listedEntries
    }, function(err, files){
      expect(files.length).toBe(2);
      next();
    })
  })
})
