var fechaActual = new Date();
var fechaExpiracion = new Date(fechaActual.getTime() + (30 * 60 * 1000)); // 30 minutos en milisegundos
// Convierte la fecha de expiración a un formato de cadena en formato UTC
var cadenaFechaExpiracion = fechaExpiracion.toUTCString();

function comprobarCookie(nombre) {
    var cookieExistente = document.cookie.split(';').some(function(item) {
        return item.trim().startsWith(nombre + '=');
    });

    if (cookieExistente) {
        window.location.href = "/chat";
    }
}

comprobarCookie("recordarUsuario");

function iniciarSesion() {
    var usuario = document.getElementById('user').value;
    var contrasena = document.getElementById('pass').value;
    var remember = document.getElementById('remember').checked;

    //HAGO LA PETICION AL SERVIDOR Y GUARDO LA RESPUESTA EN LA VARIABLE PROMISE
    var promise = $.ajax({
        type: 'POST',
        url: '/iniciar',

        //Lo que envío (en forma de JSON)
        data: JSON.stringify({ username: usuario, password: contrasena, rememberPass: remember }),
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json'
    });

    var mensajeError = document.getElementById('error');
    mensajeError.textContent = "";

    //TRATAR LA RESPUESTA QUE ME DA EL SERVIDOR
    promise.always(function (data) {
        console.log("Entra");
        if (data.res == "login true" && data.user) { //Si el login es exitoso
            window.location.replace("/chat");
            sessionStorage.setItem('nombreUsuario', data.user);
        } else if (data.res == "login remember" && data.user && data.pass) {
            document.cookie = "usuario=" + encodeURIComponent(data.user) + "; expires=" + cadenaFechaExpiracion + "; path=/";
            window.location.replace("/chat?recordarUsuario=true");
            sessionStorage.setItem('nombreUsuario', data.user);
        } else if (data.res == "login invalid") { //Si no es exitoso
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'El usuario no existe o la contraseña no es correcta.';
            mensajeError.appendChild(alertDiv);
        } else if (data.res == "login failed") { //Ha faltado un parametro
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Los parametros no están completos.';
            mensajeError.appendChild(alertDiv);
        } else { //Por si los datos son corruptos u otra cosa en vez de hacer que el cliente espere
            window.alert("Error");
        }
    });
}

document.getElementById('iniciar').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        iniciarSesion();
    }
});

function registrarUsuario() {
    var usuario = document.getElementById('user').value;
    var contrasena = document.getElementById('pass').value;

    //HAGO LA PETICION AL SERVIDOR Y GUARDO LA RESPUESTA EN LA VARIABLE PROMISE
    var promise = $.ajax({
        type: 'POST',
        url: '/registrar',

        //Lo que envío (en forma de JSON)
        data: JSON.stringify({ username: usuario, password: contrasena }),
        contentType: 'application/json;charset=UTF-8',
        dataType: 'json'
    });

    var mensajeError = document.getElementById('error');
    mensajeError.textContent = "";

    //TRATAR LA RESPUESTA QUE ME DA EL SERVIDOR
    promise.always(function (data) {
        console.log("Entra");
        if (data.res == "register true") { //Si el registro es exitoso
            window.alert("Usuario registrado con éxito.")
            window.location.replace("/iniciar");
        } else if (data.res == "register exists") { //Si el usuario ya existe
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'El usuario ya existe.';
            mensajeError.appendChild(alertDiv);
        } else if (data.res == "register failed") { //Ha faltado un parametro
            var alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Faltan parámetros.';
            mensajeError.appendChild(alertDiv);
        } else { //Por si los datos son corruptos u otra cosa en vez de hacer que el cliente espere
            window.alert("Error");
        }
    });
}

document.getElementById('registrar').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        registrarUsuario();
    }
});