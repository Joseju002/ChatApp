//Librerías principales de express, para que Node funcione
const express = require('express');
const app = express();
var session = require('express-session'); //Para el inicio de sesión
var server = require('http').Server(app);
const io = require('socket.io')(server);

//Puerto
const port = 3004;

//Para la lectura de archivos
const fs = require("fs");
app.use(express.static('public'));

//Otras dependencias
app.use(express.json()); //Para leer ficheros json
app.use(session({ //Para el inicio de sesion
    secret: 'cadena secreta',
    resave: false,
    saveUninitialiazed: true,
    cookie: { secure: false }
}));



//Para la base de datos
const mongoose = require('mongoose');
const { usuario, conectarDB } = require('./conexionBBDD.JS');



//Aqui se almacenan los usuarios conectados
var connectedUsers = {};



//Para el inicio de sesión del usuario
var auth = function (req, res, next) {
    //Si el usuario tiene los permisos
    if (req.session && req.session.user === "admin" && req.session.admin) {
        return next(); //Continua
    } else { //Si el usuario no tiene los permisos, te llevará a la página de inicio
        var contenido = fs.readFileSync("./public/index.html");
        res.setHeader("Content-type", "text/html");
        res.send(contenido);
    }
}




//Pagina principal
app.get("/", (req, res) => {
    var contenido = fs.readFileSync("./public/index.html");
    res.setHeader("Content-type", "text/html");
    res.send(contenido);
});

//GETS de control de usuarios
app.get("/iniciar", (req, res) => {
    var contenido = fs.readFileSync("./public/iniciar.html");
    res.setHeader("Content-type", "text/html");
    res.send(contenido);
});

app.get("/registrar", (req, res) => {
    var contenido = fs.readFileSync("./public/registrar.html");
    res.setHeader("Content-type", "text/html");
    res.send(contenido);
});

//POSTS del control de usuarios
app.post('/iniciar', async function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.send({ "res": "login failed" });
    } else {
        try {
            //Con 'await' le indicamos que el programa no continúe hasta que se ejecute la línea de comando
            usuarioEncontrado = await usuario.findOne({ nombre: req.body.username, password: req.body.password });
            recordarContrasena = req.body.rememberPass;
        } catch (err) {
            console.error('Error al iniciar sesion: ', err);
        }

        if (usuarioEncontrado) {
            req.session.user = "admin";
            req.session.admin = true;
            if (recordarContrasena == true) {
                return res.send({ "res": "login remember", "user": req.body.username, "pass": req.body.password });
            }
            return res.send({ "res": "login true", "user": req.body.username });
        } else {
            res.send({ "res": "login invalid" });
        }
    }
});

app.post('/registrar', async function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.send({ "res": "register failed" });
    } else {
        try {
            //Con 'await' le indicamos que el programa no continúe hasta que se ejecute la línea de comando
            usuarioExistente = await usuario.findOne({ nombre: req.body.username });
        } catch (err) {
            console.error('Error al crear usuario: ', err);
        }
        if (usuarioExistente) {
            req.session.user = "admin";
            req.session.admin = true;
            res.send({ "res": "register exists" });
        } else {
            const nuevoUsuario = new usuario({
                nombre: req.body.username,
                password: req.body.password
            });
            try {
                nuevoUsuario.save();
                console.log('Nuevo usuario creado: ', nuevoUsuario);
                res.send({ "res": "register true" });
            } catch (err) {
                console.error('Error al crear usuario: ', err);
            }
        }

    }
});

app.get('/cerrarSesion', async function (req, res) {
    // Eliminar la sesión del usuario al cerrar sesión
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
        }
        res.cookie('usuario', '', { expires: new Date(0) });
        res.redirect('/');
    });
});


//Pagina del chat
app.get("/chat", auth, (req, res) => {
    var contenido = fs.readFileSync("./public/chat.html");
    res.setHeader("Content-type", "text/html");
    res.send(contenido);
});



//Para establecer el canal de comunicacion con socket.io
//La función de io.on es gestionar las conexiones a este canal
io.on('connection', function (socket) {
    //Cada vez que alguien se conecta al canal, se muestra un mensaje y con socket.emit enviamos nuestro mensaje
    console.log('Usuario conectado:' + socket.id);
    //socket.emit('messages', messages);
    //io.emit("hay-nuevo", "nueva persona en el chat");

    // Almacenar usuario conectado
    socket.on('user-connected', function (username) {
        connectedUsers[socket.id] = { id: socket.id, user: username };
        io.emit('users-list', Object.values(connectedUsers));
    });

    // Enviar lista de usuarios conectados a todos los clientes
    //io.emit('users-list', Object.values(connectedUsers));

    //Cada vez que se produce 'new-message', se resupera la var data y el nuevo mensaje se añade a la coleccion
    socket.on('public-message', function (mensaje) {
        //Gritamos el evento 'messages' y enviamos la coleccion a los oyentes
        io.emit('public-message', { msg: mensaje, userEmisor: connectedUsers[socket.id].user, idEmisor: socket.id, idReceptor: null });
    });

    //Para enviar un mensaje privado
    socket.on('private-message', function (mensaje, destinatarioId) {
        // Enviar el mensaje al socket específico utilizando io.to()
        if (destinatarioId != socket.id) {
            io.to(destinatarioId).emit('private-message', { msg: mensaje, userEmisor: connectedUsers[socket.id].user, idEmisor: socket.id, idReceptor: destinatarioId });
        }
        //Para que el mensaje se muestre en el cliente que ha enviado el mensaje
        io.to(socket.id).emit('private-message', { msg: mensaje, userEmisor: connectedUsers[socket.id].user, idEmisor: socket.id, idReceptor: socket.id });
    });

    //Desconexión del usuario
    socket.on('disconnect', function () {
        console.log('Usuario desconectado: ' + socket.id);

        // Eliminar usuario desconectado del registro
        delete connectedUsers[socket.id];

        // Enviar lista actualizada de usuarios conectados a todos los clientes
        io.emit('users-list', Object.values(connectedUsers));
    });
});




conectarDB(); //Para que se conecte con la base de datos
//Función principal
server.listen(port, () => {
    console.log('Aplicación escuchando en el puerto ' + port);
})