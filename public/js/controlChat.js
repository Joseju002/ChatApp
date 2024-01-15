var socket = io.connect();

function addMessage(e) {
    var opcionSeleccionada = $('#elegirUser').val();

    if ($("#text").val() === "") {
        // Si el mensaje está vacío, no enviar nada
        return false;
    }

    if (opcionSeleccionada === "nadie") {
        socket.emit('public-message', $("#text").val());
        // Para que se limpie el input del mensaje al enviarlo
        $("#text").val("");
        return false;
    } else {
        socket.emit('private-message', $("#text").val(), opcionSeleccionada);
        // Para que se limpie el input del mensaje al enviarlo
        $("#text").val("");
        return false;
    }
};

$(document).ready(function () {
    var nombreUsuario = sessionStorage.getItem('nombreUsuario');
    if (!nombreUsuario) {
        nombreUsuario = obtenerCookie('usuario');
    }

    addUser(nombreUsuario);

    var insultos = ["puto", "puta", "mierda", "zorra", "subnormal", "retrasado", "imbecil", "imbécil", "idiota",
        "cabron", "cabrón", "polla", "cateto", "mongolo", "anormal", "tonto", "capullo", "joder", "follar"];

    socket.on('public-message', function (data) {
        render(data);
    });

    socket.on('private-message', function (data) {
        render(data);
    });

    socket.on('users-list', function (usuarios) {
        renderizarListaUsuarios(usuarios);
    });

    function addUser(user) {
        socket.emit('user-connected', user);
        return false;
    };

    //Esta es la función que muestra el mensaje (privado y público) en el chat
    function render(data) {
        // Obtener el contenedor donde se mostrarán los mensajes
        var contenedorMensaje = $('#mensajes');
        var espacio = document.createTextNode("\u00a0");

        // Crear un nuevo elemento de mensaje
        var messageElement = $('<div></div>');

        if (contienePalabra(data.msg, insultos)) {
            messageElement.addClass("alert alert-danger");
            messageElement.text("*Mensaje bloqueado*");
        } else {
            //Si el receptor no es nulo y se ha especificado un usuario, se envía de forma privada
            if (data.idReceptor != null) {
                messageElement.addClass("alert alert-primary");
            }

            // Crear elementos específicos para el ID del socket y el mensaje
            var idEmisorElement = $('<strong></strong>');
            // Si se especifica un receptor, se muestra que el mensaje es privado
            if (data.idReceptor == null) {
                idEmisorElement.text(data.userEmisor + ': ');
            } else {
                idEmisorElement.text(data.userEmisor + ' (PRIVADO): ');
                if (data.idEmisor != socket.id) {
                    enviarNotificacion(data.userEmisor, data.msg);
                }
            }

            if (data.idEmisor == socket.id) {
                messageElement.addClass("alert alert-success");
            }

            var mensajeElement = $('<em></em>').text(data.msg);
            mensajeElement.append(espacio);

            // Agregar los elementos creados al nuevo elemento
            messageElement.append(idEmisorElement);
            messageElement.append(mensajeElement);

            // Aquí creamos un botón con el cual se leerá el mensaje con la voz sintetizada
            var botonLeer = $('<img src="../images/speaker.png" alt="Leer mensaje" height="20" width="20" style="cursor: pointer;">');
            botonLeer.on('click', function () {
                leerTexto(data.msg);
            });

            messageElement.append(botonLeer);
        }

        // Agregar el nuevo elemento al contenedor de mensajes
        contenedorMensaje.append(messageElement);

        // Para compatibilidad con diferentes navegadores
        var cuerpo = $('body');
        var html = $('html');

        // Calcula la altura total de la página
        var alturaTotal = Math.max(cuerpo[0].scrollHeight, cuerpo[0].offsetHeight, html[0].clientHeight, html[0].scrollHeight, html[0].offsetHeight);

        // Hace scroll hacia abajo
        $('html, body').animate({
            scrollTop: alturaTotal
        }, 'slow');
    }


    function renderizarListaUsuarios(usuarios) {
        // Obtener los elementos de la lista en el HTML usando jQuery
        var listaUsuarios = $('#listaUsuarios');
        var selectElegirUsuario = $('#elegirUser');
        var mensajeBienvenida = $('#bienvenida');

        // Limpiar la lista antes de agregar los nuevos usuarios
        listaUsuarios.empty();
        selectElegirUsuario.empty();

        // Crear la opción para el chat público y agregarla al desplegable (select)
        var optionUsuario = $('<option value="nadie">Chat público</option>');
        selectElegirUsuario.append(optionUsuario);

        // Recorrer la lista de usuarios y agregarlos a la lista/desplegable en el HTML
        usuarios.forEach(function (usuario) {
            var usuarioElemento = $('<li></li>');

            if (usuario.id == socket.id) {
                mensajeBienvenida.text('Bienvenido, ' + usuario.user);
                var link = $('<a class="nav-link active"></a>').text(usuario.user);
                usuarioElemento.append(link);
            } else {
                var link = $('<a class="nav-link"></a>').text(usuario.user);
                usuarioElemento.append(link);
            }

            // Agregar el usuario a la lista en el HTML
            listaUsuarios.append(usuarioElemento);

            // Agregar el usuario a la lista desplegable (select)
            var optionUsuario = $('<option value="' + usuario.id + '">' + usuario.user + '</option>');
            selectElegirUsuario.append(optionUsuario);
        });
    }

    //Para comprobar que se envía un mensaje contiene un insulto
    function contienePalabra(cadena, insultos) {
        return insultos.some(palabra => cadena.toLowerCase().includes(palabra));
    }

    function enviarNotificacion(titulo, texto) {
        // Verificar si el navegador admite las notificaciones
        if ('Notification' in window) {
            // Verificar si las notificaciones están permitidas
            if (Notification.permission === 'granted') {
                // Crear y mostrar la notificación
                var notificacion = new Notification("Nuevo mensaje de " + titulo, {
                    body: texto // Puedes proporcionar una URL de la imagen de icono
                });
            } else if (Notification.permission !== 'denied') {
                // Solicitar permiso para mostrar notificaciones
                Notification.requestPermission().then(function (permission) {
                    if (permission === 'granted') {
                        // Crear y mostrar la notificación
                        new Notification(titulo, {
                            body: texto
                        });
                    }
                });
            }
        } else {
            alert('Las notificaciones no son compatibles con este navegador.');
        }
    }


    //Con esta función, una voz sintetizada es capaz de leer un texto
    function leerTexto(texto) {
        const synth = window.speechSynthesis;
        var voces = synth.getVoices();

        //De esta forma, le especificamos que utilice una voz en español
        var vozSeleccionada = voces.find(voz => voz.lang === 'es-ES');

        //Si no se encuentra una voz en el idioma especificado, se usa la voz predeterminada
        if (!vozSeleccionada) {
            vozSeleccionada = synth.getVoices()[0];
        }
        const ssUtterance = new SpeechSynthesisUtterance(texto);
        ssUtterance.voice = vozSeleccionada;

        synth.speak(ssUtterance);
    }

    //Para devolver una cookie
    function obtenerCookie(nombreCookie) {
        var nombre = nombreCookie + "=";
        var cookies = document.cookie.split(';');

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.indexOf(nombre) === 0) {
                return cookie.substring(nombre.length, cookie.length);
            }
        }

        // Si no se encuentra la cookie, devuelve null
        return null;
    }

    //Con este evento JQuery, podemos elegir a quién se dirigirá el mensaje más facilmente
    $(document).on('keydown', function (e) {
        // Verificar si la tecla presionada es la flecha arriba o abajo
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            var $select = $('#miSelect');

            // Evitar el comportamiento predeterminado del navegador
            e.preventDefault();

            // Obtener el índice de la opción actualmente seleccionada
            var currentIndex = $select.prop('selectedIndex');

            // Calcular el nuevo índice basado en la dirección de la flecha
            var newIndex = (e.key === 'ArrowUp') ? Math.max(0, currentIndex - 1) : Math.min($select.find('option').length - 1, currentIndex + 1);

            // Establecer la nueva opción seleccionada
            $select.prop('selectedIndex', newIndex);
        }
    });
});