///*************************************
//REQUIRES
//**************************************
const validationUtils = require("./validStats");
const { MongoClient, Collection } = require("mongodb");
const { InvalidDatabaseError } = require("./errors");
const { InvalidStatError } = require("./errors");
const logger = require("../logger");

//holds the connection to the database
let client;
//holds the collection/ values that reside in the database  
var statsCollection;
//this holds access to the database to get the collection within it
let db;

/**
 * Initialize
 * ensure proper connection to the database
 * makes sure there is a collection called statistics for either of the databases
 * @param {String} nameOfDb will be the name of the database
 * @param {boolean} resetFlag true will make a new/reset collection or false will grab the existing collection
 * @param {string} url url to access the db
 * @throws Throws if invalid database
 */
async function initialize(nameOfDb, resetFlag, url) {
  try {
    client = new MongoClient(url);
    await client.connect();
    //logs to show user connection was successful
    logger.info("Connected successfully to database");
    db = client.db(nameOfDb);

    if (resetFlag) {
      collectionCursor = db.listCollections({ name: "statistics" });
      let collectionArray = await collectionCursor.toArray();

      //will reset the collection if it exists due to reset flag being true
      if (collectionArray.length >= 1) {
        await db.collection("statistics").drop();
      }
      //creates a case insensitive collection
      const collation = { locale: "en", strength: 1 };
      await db.createCollection("statistics", { collation: collation });

      statsCollection = db.collection("statistics");
    } else {
      collectionCursor = await db.listCollections({ name: "statistics" });
      collectionArray = await collectionCursor.toArray();

      if (collectionArray.length == 0) {
        const collation = { locale: "en", strength: 1 };

        await db.createCollection("statistics", { collation: collation });
      }
      statsCollection = db.collection("statistics");
    }
  } catch (error) 
  {
    logger.error("Error while connecting to database in initialize function. " + error.message)
    throw new InvalidDatabaseError("Error while connecting to database.");
  }
}

//Closes the database connection
async function close() {
  try {
    await client.close();
    logger.info("Connection closed successfully");
  } catch (error) {
    logger.error(error.message);
  }
}

/**
 * Gets all collections and returns the result
 * @returns returns the collection to be used in other functions.
 */
function getCollection() {
  results = statsCollection.find();
  return results;
}

//Adds a stat to the database
/**
 * Adds a single Stat to the database
 * @param {Int} points number of points player has
 * @param {String} name name of the player with that many points
 * @returns the object if the add was successful and throws if unsuccessful
 * @throws a InvalidStatError if the name or points are invalid or invalidDatabaseError if there was an error with the database
 */
async function addStat(points, name){
  try {
    if (validationUtils.isValidStatistics(points, name)) {
      try {
        //inserts the stat into the database
        const stat = { points: points, name: name };
        await statsCollection.insertOne(stat);
        return stat;
      } 
      catch {
        //throws an error if an error occurs while trying to insert the Stat into the database
        throw new InvalidDatabaseError(
          "Error while inserting Stat into database"
        );
      }
    } else {
      //throws an error if an error if name or points is not valid
      throw new InvalidStatError(
        "Invalid name or points inputted.\nPoints must be a number greater than or equal to 0 and less than or equal to 100 AND name must be a valid name."
      );
    }
  } catch (error) {
    logger.error("ERROR in addStat method. "+ error.message);
    if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError("Error with database. " + error.message);
    } else {
      throw new InvalidStatError(error.message);
    }
  }
}

/**
 * Gets single stat from database
 * Throw an InvalidDatabaseError if the stat to find is not in the database.
 * @param {String} name name of the player whose stat to retrieve 
 * @returns the stat found in the database 
 * @throws a InvalidStatError if the name is invalid or invalidDatabaseError if there was an error with the database
 */
async function getSingleStat(name) {
  try {
    try {
      const stat = { name: name };
      //Searches to see if stat exists in the database 
      result = await statsCollection.findOne(stat);
      //if find was unsuccessful
      if (!result) {
        throw new InvalidStatError("Stat was not found in the database.");
      }
      return result;
    } 
    catch(error) {
      if (error instanceof InvalidDatabaseError) {
        throw new InvalidDatabaseError("Error with database. " + error.message);
      }
      else if (error instanceof InvalidStatError){
      throw new InvalidStatError("Stat was not found in the database.");
      }
      else{
        throw new InvalidDatabaseError(error.message);
      }
    }
  } 
  catch (error) {
     logger.error("ERROR in getSingleStat method. "+ error.message);
    if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError("Error with database. " + error.message);
    } else {
      throw new InvalidStatError("Invalid name inputted");
    }
  }
}
/**
 * Gets all stat from database/collection
 * it will throw an InvalidDatabaseError if the database/collection is empty
 * @returns an array of all the stats in the database
 * @throws InvalidDatabaseError if there was an error with the database
 */
async function getAllStats() {
  try {
    try {
      cursor = await statsCollection.find();
      cursor = await cursor.toArray();
      if (cursor.length == 0) {
        throw new InvalidDatabaseError("Database is empty");
      }
      return cursor;
    } catch (error) {
      throw new InvalidDatabaseError(error.message);
    }
  } catch (error) {
    logger.error("ERROR in getAllStats method. " + error.message);
    if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError("Error with database. " + error.message);
    }
  }
}
/**
 * Updates the stat in the database
 * first finds the stat to see if it exists before updating it
 * @param {String} oldname old name to find and replace with new name
 * @param {Int} oldpoints old points to find and replace with new points 
 * @param {String} newname the new name to replace old value with
 * @param {Int} newpoints the new points to replace old value with 
 * @returns A successful or unsuccessful depending on the update
 * @throws a InvalidStatError if the name or points are invalid or invalidDatabaseError if there was an error with the database
* 
*/
async function updateStat(oldname, oldpoints, newname, newpoints) {
  try {
    if (validationUtils.isValidStatistics(newpoints, newname)) {
      filter = { points: oldpoints, name: oldname };
      updateFilter = { points: newpoints, name: newname };
      let findStat = await statsCollection.findOne({name: oldname});
      if (findStat) {
        result = await statsCollection.replaceOne(filter, updateFilter);
      } else {
        throw new InvalidDatabaseError(
          "Stat to update was not found in the database."
        );
      }
      if (result) {
        return {oldname: oldname, oldpoints: oldpoints, newname: newname, newpoints: newpoints}
      } else {
        throw new InvalidDatabaseError(
          "Stat to update was not found in the database."
        );
      }
    } else {
      throw new InvalidStatError(
        "Invalid name or points inputted.\nPoints must be a number greater than or equal to 0 and less than or equal to 100 AND name must be a valid name."
      );
    }
  } catch (error) {
    logger.error("ERROR in updateStat method. " + error.message);
    if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError("Error with database. " + error.message);
    } else if(error instanceof InvalidStatError) {
      throw new InvalidStatError(error.message);
    }
    else{
      throw new InvalidDatabaseError("Error with database. " + error.message); 
    }
  }
}
/**
 * Deletes a single stat from the database
 * first finds the stat to see if exists in the database and then deletes it.
 * @param {String} name 
 * @returns object of the deleted stat
 * @throws a InvalidStatError if the name is invalid or invalidDatabaseError if there was an error with the database
 */
async function deleteStat(name) {
  try {
    try {
      const stat = { name: name };
      let findStat = await statsCollection.findOne(stat);
      if (findStat) {
        result = await statsCollection.deleteOne(stat);
      } else {
        throw new InvalidStatError(
          "Stat to delete was not found in the database."
        );
      }
      if (!result) {
        throw new InvalidDatabaseError(
          "Stat to delete was not found in the database."
        );
      }
      return findStat;
    } catch(error) {
      if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError(
        "Stat to delete was not found in the database."
      );
      }
      else if (error instanceof InvalidStatError){
        throw new InvalidStatError(error.message)
      }
      else{
        throw new InvalidDatabaseError("Error with database. " + error.message);
      }
    }
  } catch (error) {
    logger.error("ERROR in delete method. " + error.message);
    if (error instanceof InvalidDatabaseError) {
      throw new InvalidDatabaseError("Error with database. " + error.message);
    } else {
      throw new InvalidStatError("Invalid name inputted.");
    }
  }
}

module.exports = {
  updateStat,
  getCollection,
  close,
  addStat,
  getAllStats,
  getSingleStat,
  initialize,
  deleteStat,
};
