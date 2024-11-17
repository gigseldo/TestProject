var express = require("express");
let app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.set('json spaces', 3);
const path = require('path');
let PropertiesReader = require("properties-reader");
// Load properties from the file
let propertiesPath = path.resolve(__dirname, "./dbconnection.properties");
let properties = PropertiesReader(propertiesPath);

// Extract values from the properties file
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// MongoDB connection URL
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;//declare variable

//remember if we use async, we need to use await i.e. async/await works together
async function connectDB() {
  try {
    client.connect();
    console.log('Connected to MongoDB');
    db1 = client.db('Kitten');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB(); //call the connectDB function to connect to MongoDB database

//Optional if you want the get the collection name from the Fetch API in test3.html then
app.param('collectionName', async function(req, res, next, collectionName) { 
    req.collection = db1.collection(collectionName);
    /*Check the collection name for debugging if error */
    console.log('Middleware set collection:', req.collection.collectionName);
    next();
});

//if you do not want to get the collection (table name) as a parameter from the route in the Fetch API
// then do not use app.param, use the below and modify the API accordingly

app.get('/collections/test', async function(req, res, next) {
    try {
        // Use the collection name 'Products' 
        const collectionName = 'Products';
        //specify the collection as 
        req.collection = db1.collection(collectionName);
        // For debugging purposes
        console.log('Accessing collection:', collectionName);
        
        // Fetch all documents from the specified collection
        const results = await req.collection.find({}).toArray();
        
        // For debugging purposes, log results into console to check
        console.log('Retrieved documents:', results);
        
        // Return the results to the front end
        res.json(results);
    } catch (err) {
        console.error('Error fetching documents:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
}); 

// Ensure this route is defined after the middleware app.param
// get all data from our collection in Mongodb
app.get('/collections/:collectionName', async function(req, res, next) {
    try {

         //For debugging purposes
        console.log('Received request for collection:', req.params.collectionName);
        console.log('Accessing collection:', req.collection.collectionName);

        // Fetch all documents from the specified collection
        const results = await req.collection.find({}).toArray();

        //For debugging purposes, log results into console to check
        console.log('Retrieved documents:', results);

        res.json(results); //return the results to front end

        } catch (err) {
                console.error('Error fetching documents:', err.message);
                next(err);//pass the error to the next middleware or error handler in the application.
         }
});

app.get('/collections1/:collectionName', async function(req, res, next) {
    try {
        // For debugging purposes
        console.log('Received request for collection:', req.params.collectionName);
        console.log('Accessing collection:', req.collection.collectionName);
    
        // Fetch all documents from the specified collection with limit and sort
        const results = await req.collection.find({}, { limit: 3, sort: { price: -1 } }).toArray();
    
        // For debugging purposes, log results into console to check
        console.log('Retrieved documents:', results);
    
        // Return the results to the front end
        res.json(results);
    } catch (err) {
        console.error('Error fetching documents:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
    
});

app.get('/collections/:collectionName/:max/:sortAspect/:sortAscDesc', async function(req, res, next){
    try {
        // TODO: Validate params
        const max = parseInt(req.params.max, 10); // base 10
        let sortDirection = 1;
        if (req.params.sortAscDesc === "desc") {
            sortDirection = -1;
        }
    
        // For debugging purposes
        console.log('Received request with max:', max, 'and sort direction:', sortDirection);
    
        // Fetch documents with limit and sort
        const results = await req.collection.find({}, { limit: max, sort: { [req.params.sortAspect]: sortDirection } }).toArray();
    
        // For debugging purposes, log results into console to check
        console.log('Retrieved documents:', results);
    
        // Return the results to the front end
        res.json(results);
    } catch (err) {
        console.error('Error fetching documents:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
    
});

app.get('/collections/:collectionName/:id' , async function(req, res, next) {
    try {
        // For debugging purposes
        console.log('Received request for document with id:', req.params.id);
    
        // Fetch a single document by ID
        const results = await req.collection.findOne({ _id: new ObjectId(req.params.id) });
    
        // For debugging purposes, log the result into console to check
        console.log('Retrieved document:', results);
    
        // Return the result to the front end
        res.json(results);
    } catch (err) {
        console.error('Error fetching document:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
    
});

app.post('/collections/:collectionName', async function(req, res, next) {
    try {
        // TODO: Validate req.body
        console.log('Received request to insert document:', req.body);
    
        // Insert a new document
        const results = await req.collection.insertOne(req.body);
    
        // For debugging purposes, log the result into console to check
        console.log('Inserted document:', results);
    
        // Return the result to the front end
        res.json(results);
    } catch (err) {
        console.error('Error inserting document:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
    
});

app.delete('/collections/:collectionName/:id', async function(req, res, next) {
    try {
        // For debugging purposes
        console.log('Received request to delete document with id:', req.params.id);
    
        // Delete a single document by ID
        const result = await req.collection.deleteOne({ _id: new ObjectId(req.params.id) });
    
        // For debugging purposes, log the result into console to check
        console.log('Delete operation result:', result);
    
         //This property indicates the number of documents deleted by the MongoDB 
         //deleteOne or deleteMany operation.
         //Checks if exactly one document was deleted,if yes success

        res.json((result.deletedCount === 1) ? { msg: "success" } : { msg: "error" });
    } catch (err) {
        console.error('Error deleting document:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
    
});

app.put('/collections/:collectionName/:id', async function(req, res, next) {
    try {
        // For debugging purposes
        console.log('Received request to delete document with id:', req.params.id);
    
        // Delete a single document by ID
        const result = await req.collection.updateOne({_id: new ObjectId(req.params.id)},
        {$set: req.body},
        {safe: true, multi: false});
    
        // For debugging purposes, log the result into console to check
        console.log('Update operation result:', result);

        // Return the result to the front end, 
        // property of the result object returned by a MongoDB operation, updateOne 
        // It indicates how many documents matched the query criteria.
       // This checks if exactly one document was matched by the operation, if yes success
        res.json((result.matchedCount === 1) ? { msg: "success" } : { msg: "error" });

    } catch (err) {
        console.error('Error updating document:', err.message);
        next(err); // Pass the error to the next middleware or error handler in the application
    }
});
    
app.get("/", (req, res) => {
    res.send("Welcome to our homepage!");
});

app.post("/", function(req, res) {
    res.send("a POST request? Let’s create a new element");
});

app.put("/", function(req, res) {
    res.send ("Ok, let’s change an element");
});

app.delete("/", function(req, res) {
    res.send("Are you sure??? Ok, let’s delete a record");
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'An error occurred' });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });