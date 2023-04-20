const express = require("express");
const { default: pino } = require("pino");
const logger = require("../logger");
const { InvalidStatError, InvalidDatabaseError } = require("../models/errors");
const router = express.Router();
const routeRoot = "/";
const model = require("../models/statsModelDatabase");
//For instace of post with /stats endpoint to create a stat
router.post("/stats", createStat);

//For instace of GET with /stat/getall endpoint to get all stats in the database
router.get("/stats", getAllStat);

//For instace of get with /stats endpoint to find a single stat
router.get("/stats/:name", getStat);

router.put("/stats/:oldname/:oldpoints/:newname/:newpoints", updateStat);

router.delete("/stats/:name", deleteStat);

/**
 * CREATE
 *  Handles the post /stats endpoint which creates a new stat
 * Uses the req.body to get name and point to create a new stat 
 * @param {Request} request Expecting a json body to get name and point 
 * @param {Response} response Sends a successful response 200 if successfully create or a 400 response if error with validating or a 500 response if error with database
 */
async function createStat(request, response) {
  try {
    requestJson = request.body;
    data = await model.addStat(requestJson.points, requestJson.name);
    if (data) {
      logger.info("Successfully created stat");
      response.status(200);
      response.send(data);
    } else {
      logger.error("Failed to add stat");
      response.status(400);
    }
  } catch (error) {
    if (error instanceof InvalidDatabaseError) {
      logger.error("Failed to add stat due to database error. In createStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    } else if (error instanceof InvalidStatError) {
      logger.error("Failed to add stat due to bad user input. In createStat Method " + error.message);
      response.status(400);
      response.send({errorMessage: "Failed to add stat due to bad user input. In createStat Method " + error.message});
    } else {
      logger.error("Failed to add stat due to database error. In createStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    }
  }
}

/**
 * Handles the GET /stats/:name endpoint which finds a stat through a provided name
 * @param {Request} request using request parmams to get the name of the stat to look for
 * @param {Response} response Sends a successful 200 response, a 400 response if invalid name or a 500 response if there is an error with the database.
 */
async function getStat(request, response) {
  try {
    name = request.params.name;

    data = await model.getSingleStat(name);
    if (data) {
      logger.info("Successfully retrieved stat");
      response.status(200);
      response.send(
       data
      );
    }
  } catch (error) {
    console.log(error.message);
    if (error instanceof InvalidDatabaseError) {
      logger.error("Failed to get single stats due to database error. In getSIngleStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    } else if (error instanceof InvalidStatError) {
      logger.error("Failed to get single stats due to Invalid error. In getSIngleStat Method " + error.message);
      response.status(400);
      response.send({errorMessage: "Error with validation in the get single stat method. Please try again."});
    } else {
      logger.error("Failed to get single stats due to database error. In getSIngleStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    }
  }
}
/**
 * Gets all stats that are within the database 
 * @param {Request} request not being used
 * @param {Response} response Sends a successful 200 response if stats were retrived, a 400 response if error with validation or a 500 response if there is an error with the database.
 */
async function getAllStat(request, response) {
  try {
    data = await model.getAllStats();
    if (data) {
      logger.info("Successfully retrieved all stats");
      response.status(200);
      stringToReturn = "List of Stats:\n";
      for (let i = 0; i < data.length; i++) {
        stringToReturn +=
          "\nPlayer: " + data[i].name + " Points: " + data[i].points + " ";
      }
      response.send(data);
    }
  } catch (error) {
    console.log(error.message);
    if (error instanceof InvalidDatabaseError) {
      logger.error("Failed to get all stats due to database error. In getAllStats Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    } else if (error instanceof InvalidStatError) {
      logger.error("Failed to get all stats due to validation error. In getAllStats Method " + error.message);
      response.status(400);
      response.send({errorMessage: "Error with validation in the get single stat method. Please try again."});
    } else {
      logger.error("Failed to get all stats due to database error. In getAllStats Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    }
  }
}
/**
 * Updates stats by using url parameters to get old name and points as well as the new name and points
 * @param {Request} request using request parmams to get the new name and points of the stat to update   
 * @param {*} response Sends a successful 200 response if update was successful, a 400 response if error with validation or a 500 response if there is an error with the database.
 */
async function updateStat(request, response) {
  try {
    oldname = request.params.oldname;
    oldpoints = request.params.oldpoints;
    newname = request.params.newname;
    newpoints = request.params.newpoints;
    data = await model.updateStat(oldname, oldpoints, newname, newpoints);
    if (data) {
      logger.info("Successfully Updated stats");
      response.status(200);
      response.send(
       data
      );
    }
  } catch (error) {
    console.log(error.message);
    if (error instanceof InvalidDatabaseError) {
      logger.error("Failed to update stats due to database error. In updateStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    } else if (error instanceof InvalidStatError) {
      logger.error("Failed to update stats due to Validation error. In updateStat Method " + error.message);
      response.status(400);
      response.send({errorMessage: "Error with validation in the get single stat method. Please try again."});
    } else {
      logger.error("Failed to update stats due to database error. In updateStat Method " + error.message);
      response.status(500);
      response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
    }
  }
}

/**
 * Delete a stat through the provided name through url parameters
 * @param {Request} request gets the name of the stat to delete
 * @param {Response} response Sends a successful 200 response if delete was successful, a 400 response if error with validation or a 500 response if there is an error with the database. 
 */
async function deleteStat(request, response) {
    try {
     
      name = request.params.name;
      data = await model.deleteStat(name);
      if (data) {
        logger.info("Successfully deleted stats");
        response.status(200);
        response.send(
         data
        );
      }
    } catch (error) {
      console.log(error.message);
      if (error instanceof InvalidDatabaseError) {
        logger.error("Failed to delete stats due to database error. In delete stat Method " + error.message);
        response.status(500);
        response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
      } else if (error instanceof InvalidStatError) {
        logger.error("Failed to delete stats due to Validation error. In delete stat Method " + error.message);
        response.status(400);
        response.send({errorMessage: "Error with validation in the get single stat method. Please try again."});
      } else {
        logger.error("Failed to delete stats due to database error. In delete stat Method " + error.message);
        response.status(500);
        response.send({errorMessage: "Sorry there is an error with the database. Try again shortly."});
      }
    }
  }


module.exports = {
  router,
  routeRoot,
};
