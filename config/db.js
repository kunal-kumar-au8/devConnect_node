const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const conncetDB = async () =>{
    try{
        await mongoose.connect(db);

        console.log('MongoDB Connected');
    }catch(err){
        console.error(err.message);
        //  Exit process with failer
        process.exit(1);
    }
}

module.exports = conncetDB