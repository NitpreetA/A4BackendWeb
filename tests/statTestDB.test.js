jest.setTimeout(100000);
require('dotenv').config();
const model = require('../models/statsModelDatabase');
const errors = require('../models/errors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { after } = require('node:test');
const { InvalidDatabaseError } = require("../models/errors");
const { InvalidStatError } = require("../models/errors");



//Stats data for testing
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

//#region Add Stat test
test("Add Stats",async() => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    const cursor = model.getCollection();

    const result = await cursor.toArray();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);
})

test("Add Stats failed invalid points.(Edge casing -1)",async() => {
    await expect(model.addStat(-1,"Jerome")).rejects.toThrow(InvalidStatError);
}
)

test("Add Stats failed invalid points.(Edge casing 101)",async() => {
    await expect(model.addStat(101,"Jerome")).rejects.toThrow(InvalidStatError);
}
)

test("Add Stats failed invalid name",async() => {
    await expect(model.addStat(5,"")).rejects.toThrow(InvalidStatError);
}
)

test("Add Stats. Edge case testing points(0)",async() => {
    const {points,name} = {points: 0,name: "Jerome"};
    await model.addStat(points,name);
    const cursor = model.getCollection();

    const result = await cursor.toArray();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);
});
test("Add Stats. Edge case testing points.(100)",async() => {
    const {points,name} = {points: 100,name: "Jerome"};
    await model.addStat(points,name);
    const cursor = model.getCollection();

    const result = await cursor.toArray();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);
});
//#endregion

//#region find Stat test (R1)
test("Read Stats",async() => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    const cursor = model.getCollection();

    const result = await cursor.toArray();

    let findResult = await model.getSingleStat(name);
    expect(findResult.name == name).toBe(true);
    expect(findResult.points == points).toBe(true);
    
})

test("Read Stats failed to find name",async() => {
    await expect(model.getSingleStat("")).rejects.toThrow(InvalidStatError);
}
)
//#endregion

//#region find all Stat test (R2)
test("Read all Stats",async() => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    await model.addStat(8,"Jonny");
    let findResult = await model.getAllStats();
    expect(findResult[0].name == name).toBe(true);
    expect(findResult[0].points == points).toBe(true);
    expect(findResult[1].name == "Jonny").toBe(true);
    expect(findResult[1].points == 8).toBe(true);

    expect(Array.isArray(findResult)).toBe(true);
    expect(findResult.length).toBe(2);
    
})

test("Read All Stats failed  due to empty db",async() => {
    await expect(model.getAllStats()).rejects.toThrow(InvalidDatabaseError);
}
)
//#endregion

//#region Update
test("Update Stats",async() => {
    let {points,name} = generateStatsData();
    await model.addStat(points,name);
    let cursor = model.getCollection();

    let result = await cursor.toArray();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);

    await model.updateStat(name,points,"james",4);

    cursor = model.getCollection();

    result = await cursor.toArray();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);

    expect(result[0].name.toLowerCase() == "james".toLowerCase()).toBe(true);
    expect(result[0].points == 4).toBe(true);
    
})

test("Update Stats failed  due to not finding name in db",async() => {
    let {points,name} = generateStatsData();
    await model.addStat(points,name);
    await expect(model.updateStat("aj",points,"carl",5)).rejects.toThrow(InvalidDatabaseError);
}
)

test("Update Stats failed  due to not invalid types being passed in",async() => {
    let {points,name} = generateStatsData();
    await model.addStat(points,name);
    await expect(model.updateStat(name,points,"",-1)).rejects.toThrow(InvalidStatError);
}
)
//#endregion


//#region Delete
test("Delete Stats",async() => {
    const {points,name} = generateStatsData();
    await model.addStat(points,name);
    let cursor = model.getCollection();

    let result = await cursor.toArray();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name.toLowerCase() == name.toLowerCase()).toBe(true);
    expect(result[0].points == points).toBe(true);

    await model.deleteStat(name);

     cursor = model.getCollection();

     result = await cursor.toArray();

     expect(Array.isArray(result)).toBe(true);
     expect(result.length).toBe(0);

});

test("Delete Stats Fail cant find name to delete",async() => {
    await expect(model.deleteStat("")).rejects.toThrow(InvalidStatError);
});



//#endregion