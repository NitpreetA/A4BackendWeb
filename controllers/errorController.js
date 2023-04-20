const express = require('express');
const router = express.Router();
const routeRoot = '*';

router.all(routeRoot,sayError)

function sayError(request, response) {
    response.status= 404;
    response.send("Invalid url entered please try again")

}


module.exports = {
     router,
     routeRoot
}
