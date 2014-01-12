module.exports = function(client, config) {
  client.bundle.require(process.cwd()+"/client/config/"+process.env.CELL_MODE+".json", {expose: "config"});
}