jest.setTimeout(100000);
require('dotenv').config();
const model = require('../models/statsModelDatabase');
const errors = require('../models/errors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { after } = require('node:test');
const app = require('../app');
const supertest = require('supertest');
const { default: expect } = require('expect');
const { data } = require('browserslist');
const testRequest = supertest(app);




const statsData = [
    {points: 15, name: 'Drew Cochran'},
    {points: 8, name: 'Zoey Cline'},
    {points: 50, name: 'Gage Zimmerman'},
    {points: 7, name: 'Kate Mathews'},
    {points: 6, name: 'Craig Cardenas'},
    {points: 12, name: 'Jaydin Kaiser'},
    {points: 23, name: 'Sage Larsen'},
    {points: 78, name: 'Julia Whitaker'},
    {points: 96, name: 'Mira Watkins'},
    {points: 36, name: 'Isabell Chavez'},
    {points: 27, name: 'Bridger Mora'},
    {points: 43, name:  'Talia Pierce'},
]

//grabs random data from statsData array and removes it from statsData array after usage
const generateStatsData = () =>{
    const index = Math.floor(Math.random() * statsData.length);
    return statsData.slice(index,index + 1)[0];
} 

//Creating mock database
beforeAll(async () => {mongod = await MongoMemoryServer.create();
console.log("Mock Db started")
});

//closes mock db
afterAll(async () => {await mongod.stop();
console.log("Mock database stopped")

})


//Before each test it will clear the test database to start fresh
beforeEach(async() =>{
    try{
        const url = mongod.getUri();
        
        await model.initialize("statsTestDb",true,url);
        
    }catch(err){
        console.log(err.message);      
    }
})

afterEach(async() =>{
    await model.close();
})




//GET /stats
test("Get /stats success case",async () => {

    //adds stat
    const {points,name} = generateStatsData();
    await model.addStat(points,name);

    //tests if function worked properly
    const testResponse = await testRequest.get('/stats/' + name);
    expect(testResponse.status).toBe(200);


})

test("Get /stats fail case 400",async () => {
    //adds stat
    const {points,name} = generateStatsData();
    await model.addStat(points,name);

    //To check if it worked properly
    const testResponse = await testRequest.get('/stats/' + "abc");
    expect(testResponse.status).toBe(400);

    //to confirm no bug
    let result = await model.getAllStats();
    expect(result.length).toBe(1);

})

test("Get /stats fail case 500",async () => {
    //creates stat
    const {points,name} = generateStatsData();
    await model.addStat(points,name); 

    //closes connection for db 
    await model.close();
    const testResponse = await testRequest.get('/stats/' + name);
    expect(testResponse.status).toBe(500);

    //to ensure there is no error with the info in the db
    const url = mongod.getUri();
    await model.initialize("statsTestDb",false,url);
    result = await model.getAllStats();
    expect(result.length).toBe(1);

})


//POST /stats
test("Post /stats success case",async () => {
    //adds stats
    const {points,name} = generateStatsData();
    const testResponse = await testRequest.post('/stats').send({name,points});
    expect(testResponse.status).toBe(200);

    //checks if it properly added to db
    const cursor = await model.getCollection();
    const result = await cursor.toArray();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);
})

test("Post /stats fail case 500",async () => {
    
    const {points,name} = generateStatsData();
    await model.close();
    const testResponse = await testRequest.post('/stats').send({points,name});
    expect(testResponse.status).toBe(500);

    //confirms nothing was added to db
    const url = mongod.getUri();
    await model.initialize("statsTestDb",false,url);
    //should throw because nothing was added and db is empty
    await expect(model.getAllStats()).rejects.toThrow(errors.InvalidDatabaseError);
    
})

test("Post /stats fail case 400",async () => {
    const testResponse = await testRequest.post('/stats').send({points: -5 ,name: "a"});
    expect(testResponse.status).toBe(400);
    //should throw because nothing was added and db is empty
    await expect(model.getAllStats()).rejects.toThrow(errors.InvalidDatabaseError);
})
//************************************ */
//Get /stats/getall
//************************************ */
test("Get /stats/getall success case 200",async () => {
    //adds to db
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    await model.addStat(points,name);
    
    const testResponse = await testRequest.get('/stats');
    expect(testResponse.status).toBe(200);

    //Verfies that getall works
    let data = await model.getAllStats();
    expect(data.length).toBe(2);
    expect(data[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(data[0].points == points).toBe(true);
})


test("Get /stats/getall fail case 500",async () => {
    const testResponse = await testRequest.get('/stats' );
    expect(testResponse.status).toBe(500);
})
//******************************************* */
//put /stats/:name/:points/:newname/:newpoints
//******************************************** */
test("Put /stats success case 200",async () => {
    //adds stat
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    //updates stat
    const testResponse = await testRequest.put('/stats/' + name + '/' + points + '/Jim/15');
    expect(testResponse.status).toBe(200); 

    //confirm if stat updated properly
    const cursor = await model.getCollection();
    const result = await cursor.toArray();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);

})

test("Put /stats fail case 400",async () => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    const testResponse = await testRequest.put('/stats/' + name + '/' + points + '/Jim/-3');
    expect(testResponse.status).toBe(400); 

    //confirm that items in db hasn't changed
    const cursor = await model.getCollection();
    const result = await cursor.toArray();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);

})

test("Put /stats fail case 500",async () => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    await model.close();
    const testResponse = await testRequest.put('/stats/' + name + '/' + points + '/Jim/15');
    expect(testResponse.status).toBe(500); 

    //to confirm that no changes were made to db
    const url = mongod.getUri();
    await model.initialize("statsTestDb",false,url);
    result = await model.getAllStats();
    expect(result.length).toBe(1);
    

})
//****************/
//Delete /stats
//****************/
test("Delete /stats success case 200",async () => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);

    const testResponse = await testRequest.delete('/stats/' + name); 
    expect(testResponse.status).toBe(200);  
})

//
test("Delete /stats fail case 400",async () => {
    //adds stat to db
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    //main test
    const testResponse = await testRequest.delete('/stats/' + "NotName"); 
    expect(testResponse.status).toBe(400);
    //verification nothing was deleted  
    let data = await model.getAllStats();
    expect(data.length).toBe(1); 

})

test("Delete /stats fail case 500",async () => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    await model.close();
    const testResponse = await testRequest.delete('/stats/' + name);
    expect(testResponse.status).toBe(500); 
    //verification nothing was deleted 
    const url = mongod.getUri();
    await model.initialize("statsTestDb",false,url);
    result = await model.getAllStats();
    expect(result.length).toBe(1);
    

})