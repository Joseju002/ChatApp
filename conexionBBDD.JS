const mongoose = require('mongoose');

//Almacenamos nuestra BBDD en una variable
const mongoDBURI = "mongodb+srv://Joseju:1234@cluster1.k9ktct4.mongodb.net/ChatApp";

//Creamos un esquema del usuario
const usuarioSchema = new mongoose.Schema({
    nombre: String,
    password: String
});

//Creamos el modelo (tabla)
const usuario = mongoose.model('usuarios', usuarioSchema);

//Conectamos nuestra base de datos
const conectarDB = async () => {
    try {
        await mongoose.connect(mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true});
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB: ', err);
        process.exit(1);
    }
};

//Para poder utilizar este código en el servidor
module.exports = {usuario, conectarDB};
