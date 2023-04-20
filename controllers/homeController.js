const express = require('express');
const router = express.Router();
const routeRoot = '/';


router.get('/',sayHelloWorld)

function sayHelloWorld(request, response) {
    response.status= 200;
    response.send("Hello World")

}

module.exports = {
    router,
    routeRoot
}
