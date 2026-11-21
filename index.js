import express from "express"
import cors from "cors";
import 'dotenv/config'
import { jwtVerify, createRemoteJWKSet } from 'jose'
const app = express();
const port = process.env.PORT || 8000;
// add middleware
app.use(express.json());
app.use(cors());
// add database connection with mongoose

import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient(`mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@ac-7wvgkyi-shard-00-00.gskeftb.mongodb.net:27017,ac-7wvgkyi-shard-00-01.gskeftb.mongodb.net:27017,ac-7wvgkyi-shard-00-02.gskeftb.mongodb.net:27017/?ssl=true&replicaSet=atlas-41bbb8-shard-0&authSource=admin`);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const clientConnection = await connectToMongoDB();
const db = clientConnection.db('travel-world');
const destinationCollection = db.collection('destinations');
const myDestination = db.collection('my-destinations')

app.get('/',(req,res)=>{
  res.send('hello backendworld ')
})


// veryfy backend api

const veryfyToken =async(req,res,next)=>{
  const authrization = req.headers.authorization

  if (!authrization) {
    return res.status(401).send({msg : "unauthorise"});
  }
  const token = authrization.split(" ")[1];
  if (!token) {
    return res.status(401).send({msg : "unauthorise"});
  }

      const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_PORT_URL}/api/auth/jwks`)
    )
    try {
      const { payload } = await jwtVerify(token, JWKS);
      next();
    } catch (error) {
      return res.status(401).send({msg : "unauthorise"});
    }
       
}
app.post('/destination',async (req,res)=>{
  // Handle the POST request for adding a destination
  const newDestination = req.body;
  console.log(newDestination);
  const result = await destinationCollection.insertOne(newDestination);
  res.status(201).json(result);
})

app.get('/destination/:id',veryfyToken,async(req,res)=>{
  
  const id = req.params.id;
  const objId = {_id:new ObjectId(id)}
  const result = await destinationCollection.findOne(objId);
  res.send(result);
})

app.patch('/destination/:id',async(req,res)=>{
  const id = req.params.id;
  const objId = {_id:new ObjectId(id)}
  const updatedDestination = req.body;
  console.log(updatedDestination);
  const result = await destinationCollection.updateOne(objId,{$set: updatedDestination});
  res.send(result);
})

app.delete('/destination/:id',async(req,res)=>{
  const id = req.params.id;
  const quary = {_id: new ObjectId(id)};
  const result = await destinationCollection.deleteOne(quary);
  res.send(result);
})

app.get('/destination',async (req,res)=>{
  // Handle the GET request for retrieving destinations
  const destinations = destinationCollection.find({});
  const results = await destinations.toArray();
  res.send(results);
})

// my destinations 

app.post('/my-destinations',async(req,res)=>{
  const newDestination = req.body;
  const result = await myDestination.insertOne(newDestination);
  res.send(result)

})

app.get('/my-destinations/:email',async(req,res)=>{
  const{email}= req.params;
  const destinations = myDestination.find({userEmail:email});
  const results = await destinations.toArray();
  res.send(results)
})

app.delete('/my-destinations/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  
  const query = {
    _id: id
  };

  const result = await myDestination.deleteOne(query);
  console.log(result);
  
  res.send(result);
});

app.listen(port,()=>{
  console.log(port ,`is successfully run`);
  
})


export default app;
