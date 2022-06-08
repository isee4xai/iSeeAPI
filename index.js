require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

const usecases = require('./src/routes/usecases');
const questionnaire = require('./src/routes/questionnaire');
// Add other service routes here. e.g. questionaires
// const usecases = require('./src/routes/usecases');

const app = express(); 
const PORT = process.env.PORT || 3000; 
app.use(express.json());

// For testing purposes 
app.get("/", (req, res) => { 
    res.send("iSee Core API"); 
}); 

app.listen(PORT, () => { 
    console.log(`API is listening on port ${PORT}`); 
});

app.use('/api/usecases/', usecases)
app.use('/api/questionnaire/', questionnaire)