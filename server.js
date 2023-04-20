require("dotenv").config();
const app = require('./app');
const port = 1339;

const model = require("./models/statsModelDatabase");

const url = process.env.URL_PRE + process.env.MONGO_PSWD + process.env.URL_POST;

model.initialize("Stats", false, url)

    .then(

        app.listen(port) // Run the server​

    );