const express = require('express');
const app = express();
const expressListRoutes = require('express-list-routes');
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require('./logger');
const pinohttp = require('pino-http');
const httpLogger = pinohttp({logger: logger});


const controllers = ['homeController','statsController' ,'errorController'] 
app.use(httpLogger);
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// Register routes from all controllers ​
controllers.forEach((controllerName) => {
    try {
        const controllerRoutes = require('./controllers/' + controllerName);

        app.use(controllerRoutes.routeRoot,controllerRoutes.router);
    } catch (error) {      
       logger.error(error);
       throw error; 

    }    
})
expressListRoutes(app,{prefix:'/'});
module.exports = app