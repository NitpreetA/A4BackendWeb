//Validates the points and name to ensure proper stats are entered into the database.
function isValidStatistics(points,name){

    if(!name ){

        return false;

    }
    if(points<0 || points>100 || isNaN(points)){
        return false;

    }

    return true;

}


module.exports = {isValidStatistics};