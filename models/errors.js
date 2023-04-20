//Will throw if there is any error with the input values.
class InvalidStatError extends Error {}

//If any error with the database it will throw a Invalid database error
class InvalidDatabaseError extends Error {}

module.exports = {InvalidDatabaseError,InvalidStatError};