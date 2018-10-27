var project = require('pillars'),
    GDB = require('goblindb'),
    exec = require('child_process').exec,
    fs = require('fs'),
    Scheduled = require('scheduled'),
    harmonizer = require('./datasource/harmonizer.js');
    
// Starting the project
var eventsApi = project.services.get('http').configure({
    port: process.env.PORT || 3000
})

eventsApi.start();

var goblinDB = GDB();
var data = goblinDB.get("events");

// Define Rutes
var pingRoute = require('./routes/index');
var eventsRoute = require('./routes/events')(goblinDB);
var eventByIdRoute = require('./routes/eventById')(goblinDB);

// Adding routes objects to the project
project.routes.add(pingRoute);
project.routes.add(eventsRoute);
project.routes.add(eventByIdRoute);

//Define here the array of scrappers
var spiders = ['meetup'];

// Cron Tasks
 var pythonRocks = new Scheduled({
    id: "pythonRocks",
    pattern: "45 18 * * * *",
    task: function() {
                spiders.forEach(function (spider) {                    
                        console.log(`---- Proceso hijo de ${spider} Iniciado! ------`);
                        exec('cd datasource && scrapy crawl ' + spider + ' -o output/' + spider + '.json', function(error, stdout, stderr) {
                            console.log(`---- Proceso hijo de ${spider} terminado! -----`);
                            if (stdout) {
                                console.log('stdout: ' + stdout);
                            }

                            if (stderr) {
                                console.log('stderr: ' + stderr);
                            }

                            if (error) {
                                console.log('exec error: ' + error);
                            }
                        });
                    
                });
            }
}).start();


var harmonizerTask = new Scheduled({
    id: "harmonizerTask",
    pattern: "15 19 * * * *",
    task: function() {
        harmonizer(goblinDB);
    }
}).start();

goblinDB.on('change', function(){
    data = goblinDB.get("events");
});

harmonizerTask.launch();
pythonRocks.launch();

module.exports = eventsApi;
