require('dotenv').config();

const cors = require('cors')
const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

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
const users = require('./src/routes/users');

const authJwt = require('./src/middlewares/authJWT');
const interaction = require('./src/routes/interaction');
const stats = require('./src/routes/stats');
const trees = require('./src/routes/trees');
const explainers = require('./src/routes/explainers');
const cbr_cycle = require('./src/routes/cbr_cycle');
// Add other service routes here. e.g. questionaires



const app = express();
const PORT = process.env.PORT || 3000;

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

app.use(express.json());
app.use(cors());

app.use(function (req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});


// For testing purposes 
app.get("/", (req, res) => {
    res.send("iSee Core API");
});

app.listen(PORT, () => {
    console.log(`API is listening on port ${PORT}`);
});

app.use('/api/usecases/', [authJwt.verifyToken, authJwt.isDesignUser], usecases);
app.use('/api/cbr/',[authJwt.verifyToken, authJwt.isDesignUser], cbr_cycle)

app.use('/api/questionnaire/', questionnaire)
app.use('/api/user/', users)
app.use('/api/stats/', stats)

// For Explainer Related
app.use('/api/explainers/', explainers)

// For Explanation Editor
app.use('/api/trees/', trees)

// Dialog Manager Storage
app.use('/api/interaction/', [authJwt.verifyToken, authJwt.isDesignUser], interaction);
