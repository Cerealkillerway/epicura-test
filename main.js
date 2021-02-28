const fetch = require('node-fetch')
const { MongoClient } = require('mongodb')
const mongoUrl = 'mongodb://127.0.0.1:27017'
const dbName = 'epicura-test'

async function run() {
  const uniqueOperationTypes = []
  const ids = []

  // get operation tasks
  const result = await fetch('https://backend-staging.epicuramed.it/operationtasks', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  const data = await result.json()

  let disciplineIds = []

  // get unique operationTypes
  data.forEach(element => {
    if (!ids.includes(element.operationType.id)) {
      uniqueOperationTypes.push(element.operationType)
      ids.push(element.operationType.id)
      disciplineIds.push(element.operationType.discipline)
    }
  })

  // get unique discipline ids
  disciplineIds = disciplineIds.filter((element, index) => disciplineIds.indexOf(element) === index)

  const disciplinePromises = disciplineIds.map(id => fetch(`https://backend-staging.epicuramed.it/disciplines/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json()))
  const disciplines = await Promise.all(disciplinePromises)

  // persist to mongodb
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect()

    const database = client.db(dbName)
    let collection = database.collection('discipline')
    let result = await collection.insertMany(disciplines)

    console.log(`${result.insertedCount} documents were inserted in discipline`)

    collection = database.collection('operationType')
    result = await collection.insertMany(uniqueOperationTypes)

    console.log(`${result.insertedCount} documents were inserted in operationType`)
  } catch(error) {
    console.log(error)
  } finally {
    await client.close()
  }
}

run()
