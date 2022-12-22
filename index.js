const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qytn8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function verifyToken(req,res,next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1]
    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email
    }
    catch{

    }
  }
  next();
}

async function run(){
    try{
        await client.connect();

        // for sending data on database
        const database = client.db("StickmanTechnology");
        const appointmentCollection = database.collection("userInfo");
        const usersCollection = database.collection("userloginData");

        app.get("/singleUserInfo",async(req,res)=>{
          const email = req.query.email;
          const date = req.query.date ;
          const query = {email:email, date:date};
          const result = appointmentCollection.find(query);
          const appointments = await result.toArray();
          res.json(appointments);
        })

        app.get("/userInfo",async(req,res)=>{
          const appointments = appointmentCollection.find({});
          const result = await appointments.toArray();
          res.send(result)
        })

        app.get("/users/:email",async(req,res)=>{
          const email = req.params.email;
          const query = {email:email};
          const user = await usersCollection.findOne(query);
          let isAdmin = false;
          if(user?.role === "admin"){
              isAdmin = true;
          }
          res.json({admin:isAdmin})
        })

        app.post("/userInfo",async(req,res)=>{
          const appointment = req.body;
          const result = await appointmentCollection.insertOne(appointment);
          res.json(result)
        })
        
        app.post("/userlogin",async(req,res)=>{
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          res.json(result)
        })
    }
    finally{
        // await client.close(); 
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Stackman Technology')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
