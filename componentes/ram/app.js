/* ============================================================
   APP.JS - COMPONENTE MEMORIA RAM
   Feria FP Bajo Aragón - Hardware RA + Ranking Firebase
   Administrador + reinicio remoto + cronómetro
   ============================================================ */

const CONFIG_LOCAL = typeof CONFIG_AR !== 'undefined'
    ? CONFIG_AR
    : {
        componenteId: 'ram',
        escalaInicial: 1,
        escalaMinima: 0.005,
        pasoEscala: 0.05,
        posicionInicial: { x: 0, y: 0.2, z: 0 },
        rotacionInicial: { x: 0, y: 0, z: 0 }
    };

const COMPONENTE_ID = CONFIG_LOCAL.componenteId || 'ram';

const RUTA_RANKING_FIREBASE_DIRECTO = 'rankingFeriaFPBajoAragon';
const RUTA_CONTROL_REINICIO = 'controlFeriaFPBajoAragon/reinicio';

const ALIAS_ADMIN = 'aalbaladejob';

const PREGUNTAS = [
    {
        texto: '¿Cuál es la función principal de la memoria RAM?',
        opciones: [
            {
                texto: 'Guardar temporalmente datos e instrucciones mientras el equipo está encendido',
                correcta: true,
                feedbackCorrecto: 'Correcto. La RAM almacena temporalmente la información que necesitan la CPU y los programas en ejecución.'
            },
            {
                texto: 'Guardar archivos permanentemente aunque se apague el ordenador',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El almacenamiento permanente lo realizan discos duros o SSD.'
            },
            {
                texto: 'Transformar la corriente eléctrica de la red',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Esa función corresponde a la fuente de alimentación.'
            }
        ]
    },
    {
        texto: '¿Qué ocurre con los datos de la RAM al apagar el ordenador?',
        opciones: [
            {
                texto: 'Se pierden porque es una memoria volátil',
                correcta: true,
                feedbackCorrecto: 'Muy bien. La RAM es volátil: necesita energía para mantener los datos.'
            },
            {
                texto: 'Se guardan para siempre en el módulo',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM no conserva los datos cuando se corta la alimentación.'
            },
            {
                texto: 'Se imprimen automáticamente',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Apagar el equipo no imprime los datos de la RAM.'
            }
        ]
    },
    {
        texto: '¿Dónde se instala la memoria RAM en un ordenador de sobremesa?',
        opciones: [
            {
                texto: 'En las ranuras DIMM de la placa base',
                correcta: true,
                feedbackCorrecto: 'Correcto. Los módulos de RAM se instalan en ranuras DIMM de la placa base.'
            },
            {
                texto: 'Dentro de la fuente de alimentación',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La fuente alimenta el equipo, pero no contiene la RAM.'
            },
            {
                texto: 'En el puerto HDMI',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. HDMI es una conexión de vídeo y audio.'
            }
        ]
    },
    {
        texto: '¿Qué puede ocurrir si un equipo tiene poca memoria RAM?',
        opciones: [
            {
                texto: 'Puede ir más lento al abrir varios programas o trabajar con muchas pestañas',
                correcta: true,
                feedbackCorrecto: 'Muy bien. Si falta RAM, el sistema puede usar memoria virtual en disco, que es mucho más lenta.'
            },
            {
                texto: 'La fuente deja de convertir corriente',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La cantidad de RAM no impide que la fuente convierta corriente.'
            },
            {
                texto: 'El monitor deja de tener píxeles',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Los píxeles pertenecen a la pantalla, no a la RAM.'
            }
        ]
    },
    {
        texto: '¿Qué significa que dos módulos trabajen en Dual Channel?',
        opciones: [
            {
                texto: 'Que la placa puede acceder a dos canales de memoria para mejorar el rendimiento',
                correcta: true,
                feedbackCorrecto: 'Correcto. Dual Channel puede aumentar el ancho de banda de memoria si se instalan módulos compatibles en las ranuras adecuadas.'
            },
            {
                texto: 'Que la RAM funciona como tarjeta gráfica dedicada',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Dual Channel mejora el acceso a memoria, pero no convierte la RAM en una GPU dedicada.'
            },
            {
                texto: 'Que los módulos se conectan al cable HDMI',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM se instala en la placa base, no en HDMI.'
            }
        ]
    }
];

let escalaActual = CONFIG_LOCAL.escalaInicial;
let rotacionX = CONFIG_LOCAL.rotacionInicial.x;
let rotacionY = CONFIG_LOCAL.rotacionInicial.y;
let preguntaActual = 0;

let alias = localStorage.getItem('fp_alias') || '';
let progreso = {};
let ordenOpcionesPorPregunta = {};

let intervaloCronometro = null;
let tiempoInicioReto = 0;
let tiempoFinalReto = 0;

window.addEventListener('load', function () {
    cargarEscalaGuardada();
    leerConfiguracionDesdeURL();

    iniciarAlias();
    cargarProgreso();
    actualizarBotonRankingAdmin();

    preguntaActual = buscarPrimeraPreguntaPendiente();

    if (alias) {
        iniciarCronometroReto();
    } else {
        actualizarCronometroVisible();
    }

    actualizarPuntuacion();
    cargarPregunta();

    reiniciarModelo(false);

    configurarEventosMarcador();
    configurarInputAlias();
    comprobarFirebaseComponente();
    escucharReinicioRemoto();
});

function esAdministrador() {
    return alias && alias.trim().toLowerCase() === ALIAS_ADMIN;
}

function actualizarBotonRankingAdmin() {
    const botonRanking = document.querySelector('.ranking-link');

    if (!botonRanking) {
        return;
    }

    if (esAdministrador()) {
        botonRanking.style.display = '';
    } else {
        botonRanking.style.display = 'none';
    }
}

function comprobarFirebaseComponente() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK no está cargado en la página de RAM.');
        return;
    }

    if (!window.rankingDB) {
        console.warn('window.rankingDB no existe. Revisa ../../firebase-config.js.');
        return;
    }

    console.log('Firebase disponible en página RAM.');

    window.rankingDB.ref('.info/connected').on('value', function (snapshot) {
        console.log('Firebase conectado desde RAM:', snapshot.val());
    });
}

function escucharReinicioRemoto() {
    if (!window.rankingDB) {
        console.warn('No se puede escuchar reinicio remoto porque Firebase no está disponible.');
        return;
    }

    window.rankingDB.ref(RUTA_CONTROL_REINICIO).on('value', function (snapshot) {
        const marcaReinicio = snapshot.val();

        if (!marcaReinicio) {
            return;
        }

        const ultimaMarcaLocal = localStorage.getItem('fp_ultima_marca_reinicio') || '';

        if (String(marcaReinicio) === String(ultimaMarcaLocal)) {
            return;
        }

        localStorage.setItem('fp_ultima_marca_reinicio', String(marcaReinicio));

        limpiarDatosLocalesPorReinicio();

        alert('El profesor ha reiniciado el reto. Puedes introducir un nuevo alias.');

        window.location.reload();
    });
}

function limpiarDatosLocalesPorReinicio() {
    const clavesABorrar = [];

    for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);

        if (
            clave === 'fp_alias' ||
            clave === 'fp_ranking_local' ||
            clave.startsWith('fp_progreso_') ||
            clave.startsWith('fp_escala_') ||
            clave.startsWith('fp_tiempo_inicio_') ||
            clave.startsWith('fp_tiempo_final_')
        ) {
            clavesABorrar.push(clave);
        }
    }

    clavesABorrar.forEach(function (clave) {
        localStorage.removeItem(clave);
    });

    sessionStorage.clear();
}

function claveTiempoInicioAlias() {
    return 'fp_tiempo_inicio_' + normalizarAlias(alias);
}

function claveTiempoFinalAlias() {
    return 'fp_tiempo_final_' + normalizarAlias(alias);
}

function iniciarCronometroReto() {
    if (!alias) {
        return;
    }

    const tiempoGuardado = localStorage.getItem(claveTiempoInicioAlias());

    if (tiempoGuardado) {
        tiempoInicioReto = Number(tiempoGuardado);
    } else {
        tiempoInicioReto = Date.now();
        localStorage.setItem(claveTiempoInicioAlias(), String(tiempoInicioReto));
    }

    const tiempoFinalGuardado = localStorage.getItem(claveTiempoFinalAlias());

    if (tiempoFinalGuardado) {
        tiempoFinalReto = Number(tiempoFinalGuardado);
    } else {
        tiempoFinalReto = 0;
    }

    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }

    intervaloCronometro = setInterval(function () {
        actualizarCronometroVisible();
    }, 1000);

    actualizarCronometroVisible();
}

function finalizarCronometroSiTerminado() {
    if (!alias) {
        return;
    }

    if (preguntaActual < PREGUNTAS.length) {
        return;
    }

    if (tiempoFinalReto > 0) {
        return;
    }

    tiempoFinalReto = Date.now();
    localStorage.setItem(claveTiempoFinalAlias(), String(tiempoFinalReto));

    actualizarCronometroVisible();
}

function obtenerTiempoRetoSegundos() {
    if (!alias || !tiempoInicioReto) {
        return 0;
    }

    const fin = tiempoFinalReto > 0 ? tiempoFinalReto : Date.now();

    return Math.max(0, Math.floor((fin - tiempoInicioReto) / 1000));
}

function formatearTiempo(segundosTotales) {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;

    return String(minutos).padStart(2, '0') + ':' + String(segundos).padStart(2, '0');
}

function actualizarCronometroVisible() {
    const segundos = obtenerTiempoRetoSegundos();
    const tiempoTexto = formatearTiempo(segundos);

    actualizarTexto('tiempo-visible', tiempoTexto);
    actualizarTexto('tiempo-panel', tiempoTexto);
}

function leerConfiguracionDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);

    const escalaURL = parametros.get('escala');
    const pasoURL = parametros.get('paso');
    const posXURL = parametros.get('posX');
    const posYURL = parametros.get('posY');
    const posZURL = parametros.get('posZ');
    const rotXURL = parametros.get('rotX');
    const rotYURL = parametros.get('rotY');
    const rotZURL = parametros.get('rotZ');

    if (escalaURL !== null && !isNaN(parseFloat(escalaURL))) {
        CONFIG_LOCAL.escalaInicial = parseFloat(escalaURL);
        escalaActual = CONFIG_LOCAL.escalaInicial;
    }

    if (pasoURL !== null && !isNaN(parseFloat(pasoURL))) {
        CONFIG_LOCAL.pasoEscala = parseFloat(pasoURL);
    }

    if (posXURL !== null && !isNaN(parseFloat(posXURL))) {
        CONFIG_LOCAL.posicionInicial.x = parseFloat(posXURL);
    }

    if (posYURL !== null && !isNaN(parseFloat(posYURL))) {
        CONFIG_LOCAL.posicionInicial.y = parseFloat(posYURL);
    }

    if (posZURL !== null && !isNaN(parseFloat(posZURL))) {
        CONFIG_LOCAL.posicionInicial.z = parseFloat(posZURL);
    }

    if (rotXURL !== null && !isNaN(parseFloat(rotXURL))) {
        CONFIG_LOCAL.rotacionInicial.x = parseFloat(rotXURL);
        rotacionX = CONFIG_LOCAL.rotacionInicial.x;
    }

    if (rotYURL !== null && !isNaN(parseFloat(rotYURL))) {
        CONFIG_LOCAL.rotacionInicial.y = parseFloat(rotYURL);
        rotacionY = CONFIG_LOCAL.rotacionInicial.y;
    }

    if (rotZURL !== null && !isNaN(parseFloat(rotZURL))) {
        CONFIG_LOCAL.rotacionInicial.z = parseFloat(rotZURL);
    }
}

function claveEscalaGuardada() {
    return 'fp_escala_' + COMPONENTE_ID;
}

function cargarEscalaGuardada() {
    const escalaGuardada = localStorage.getItem(claveEscalaGuardada());

    if (escalaGuardada !== null) {
        const valor = parseFloat(escalaGuardada);

        if (!isNaN(valor)) {
            CONFIG_LOCAL.escalaInicial = valor;
            escalaActual = valor;
        }
    }
}

function guardarEscalaActual() {
    marcarBotonTemporal('btn-guardar');

    localStorage.setItem(claveEscalaGuardada(), escalaActual);

    mostrarMensajeVisor('✅ Tamaño guardado. Escala inicial: ' + escalaActual.toFixed(3));
}

function obtenerModelo() {
    return document.getElementById('modelo-ordenador');
}

function aplicarEscala(mostrarMensaje) {
    const modelo = obtenerModelo();

    if (!modelo) {
        console.log('No se encuentra el modelo 3D.');
        return;
    }

    modelo.setAttribute('scale', {
        x: escalaActual,
        y: escalaActual,
        z: escalaActual
    });

    if (mostrarMensaje !== false) {
        mostrarMensajeVisor('Escala actual: ' + escalaActual.toFixed(3));
    }
}

function aplicarPosicionInicial() {
    const modelo = obtenerModelo();

    if (!modelo) {
        return;
    }

    modelo.setAttribute('position', {
        x: CONFIG_LOCAL.posicionInicial.x,
        y: CONFIG_LOCAL.posicionInicial.y,
        z: CONFIG_LOCAL.posicionInicial.z
    });
}

function aplicarRotacionActual() {
    const modelo = obtenerModelo();

    if (!modelo) {
        return;
    }

    modelo.setAttribute('rotation', {
        x: rotacionX,
        y: rotacionY,
        z: CONFIG_LOCAL.rotacionInicial.z
    });
}

function girarModelo() {
    marcarBotonTemporal('btn-girar');

    rotacionY += 30;

    aplicarRotacionActual();
}

function inclinarArriba() {
    marcarBotonTemporal('btn-arriba');

    rotacionX -= 15;

    aplicarRotacionActual();
}

function inclinarAbajo() {
    marcarBotonTemporal('btn-abajo');

    rotacionX += 15;

    aplicarRotacionActual();
}

function aumentarModelo() {
    marcarBotonTemporal('btn-mas');

    escalaActual += CONFIG_LOCAL.pasoEscala;

    aplicarEscala(true);
}

function reducirModelo() {
    marcarBotonTemporal('btn-menos');

    escalaActual -= CONFIG_LOCAL.pasoEscala;

    if (escalaActual < CONFIG_LOCAL.escalaMinima) {
        escalaActual = CONFIG_LOCAL.escalaMinima;
    }

    aplicarEscala(true);
}

function reiniciarModelo(mostrarEfecto) {
    if (mostrarEfecto !== false) {
        marcarBotonTemporal('btn-reset');
    }

    escalaActual = CONFIG_LOCAL.escalaInicial;
    rotacionX = CONFIG_LOCAL.rotacionInicial.x;
    rotacionY = CONFIG_LOCAL.rotacionInicial.y;

    aplicarEscala(mostrarEfecto !== false);
    aplicarPosicionInicial();
    aplicarRotacionActual();
}

function mostrarMensajeVisor(mensaje) {
    const aviso = document.getElementById('aviso');

    if (!aviso) {
        return;
    }

    aviso.innerHTML = mensaje;
    aviso.style.display = 'block';
}

function configurarEventosMarcador() {
    const marcador = document.querySelector('#markerA');
    const aviso = document.querySelector('#aviso');

    if (!marcador || !aviso) {
        return;
    }

    marcador.addEventListener('markerFound', function () {
        aviso.innerHTML = '✅ Marcador detectado. Explora la memoria RAM.';
        aviso.style.display = 'block';
    });

    marcador.addEventListener('markerLost', function () {
        aviso.innerHTML = 'Enfoca de nuevo el marcador de la memoria RAM.';
        aviso.style.display = 'block';
    });
}

function normalizarAlias(texto) {
    return encodeURIComponent(texto.trim().toLowerCase());
}

function claveProgresoAlias() {
    return 'fp_progreso_' + normalizarAlias(alias);
}

function iniciarAlias() {
    const modal = document.getElementById('modal-alias');
    const aliasVisible = document.getElementById('alias-visible');

    if (alias.trim() !== '') {
        if (modal) {
            modal.style.display = 'none';
        }

        if (aliasVisible) {
            aliasVisible.innerText = alias;
        }
    } else {
        if (modal) {
            modal.style.display = 'flex';
        }

        if (aliasVisible) {
            aliasVisible.innerText = '---';
        }
    }
}

function configurarInputAlias() {
    const inputAlias = document.getElementById('alias-input');

    if (!inputAlias) {
        return;
    }

    inputAlias.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter') {
            guardarAlias();
        }
    });
}

function guardarAlias() {
    const input = document.getElementById('alias-input');

    if (!input) {
        return;
    }

    const valor = input.value.trim();

    if (valor.length < 2) {
        alert('Escribe un alias de al menos 2 caracteres.');
        return;
    }

    alias = valor.substring(0, 18);
    localStorage.setItem('fp_alias', alias);

    actualizarTexto('alias-visible', alias);
    actualizarBotonRankingAdmin();

    const modal = document.getElementById('modal-alias');

    if (modal) {
        modal.style.display = 'none';
    }

    cargarProgreso();

    preguntaActual = buscarPrimeraPreguntaPendiente();

    iniciarCronometroReto();

    cargarPregunta();
    actualizarPuntuacion();
}

function cambiarAlias() {
    cerrarPaneles();

    const input = document.getElementById('alias-input');
    const modal = document.getElementById('modal-alias');

    if (input) {
        input.value = alias;
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

function cargarProgreso() {
    if (!alias) {
        progreso = {};
        return;
    }

    progreso = JSON.parse(localStorage.getItem(claveProgresoAlias()) || '{}');
}

function guardarProgreso() {
    if (!alias) {
        return;
    }

    localStorage.setItem(claveProgresoAlias(), JSON.stringify(progreso));
}

function mostrarPanel(tipo) {
    cerrarPaneles();
    marcarBotonPanel(tipo);

    if (tipo === 'info') {
        mostrarElemento('panel-info');
    }

    if (tipo === 'reto') {
        mostrarElemento('panel-reto');
        cargarPregunta();
    }

    if (tipo === 'puntuacion') {
        actualizarPuntuacion();
        mostrarElemento('panel-puntuacion');
    }

    if (tipo === 'ranking') {
        mostrarRankingLocal();
        mostrarElemento('panel-ranking');
    }

    const aviso = document.getElementById('aviso');

    if (aviso) {
        aviso.style.display = 'none';
    }
}

function cerrarPaneles() {
    ocultarElemento('panel-info');
    ocultarElemento('panel-reto');
    ocultarElemento('panel-puntuacion');
    ocultarElemento('panel-ranking');

    quitarBotonesActivos();
}

function mostrarElemento(id) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.style.display = 'block';
    }
}

function ocultarElemento(id) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.style.display = 'none';
    }
}

function quitarBotonesActivos() {
    const botones = ['btn-info', 'btn-reto', 'btn-puntos'];

    botones.forEach(function (id) {
        const boton = document.getElementById(id);

        if (boton) {
            boton.classList.remove('boton-activo');
        }
    });
}

function marcarBotonPanel(tipo) {
    quitarBotonesActivos();

    let idBoton = '';

    if (tipo === 'info') {
        idBoton = 'btn-info';
    }

    if (tipo === 'reto') {
        idBoton = 'btn-reto';
    }

    if (tipo === 'puntuacion') {
        idBoton = 'btn-puntos';
    }

    const boton = document.getElementById(idBoton);

    if (boton) {
        boton.classList.add('boton-activo');
    }
}

function marcarBotonTemporal(idBoton) {
    const boton = document.getElementById(idBoton);

    if (!boton) {
        return;
    }

    boton.classList.add('boton-pulsado');

    setTimeout(function () {
        boton.classList.remove('boton-pulsado');
    }, 180);
}

function idPregunta(indice) {
    return COMPONENTE_ID + '-pregunta-' + indice;
}

function buscarPrimeraPreguntaPendiente() {
    for (let i = 0; i < PREGUNTAS.length; i++) {
        if (progreso[idPregunta(i)] === undefined) {
            return i;
        }
    }

    return PREGUNTAS.length;
}

function mezclarArray(arrayOriginal) {
    const array = arrayOriginal.slice();

    for (let i = array.length - 1; i > 0; i--) {
        const indiceAleatorio = Math.floor(Math.random() * (i + 1));
        const temporal = array[i];

        array[i] = array[indiceAleatorio];
        array[indiceAleatorio] = temporal;
    }

    return array;
}

function obtenerOrdenOpciones(indicePregunta) {
    if (!ordenOpcionesPorPregunta[indicePregunta]) {
        const indices = PREGUNTAS[indicePregunta].opciones.map(function (_, indice) {
            return indice;
        });

        ordenOpcionesPorPregunta[indicePregunta] = mezclarArray(indices);
    }

    return ordenOpcionesPorPregunta[indicePregunta];
}

function cargarPregunta() {
    const contenedor = document.getElementById('contenedor-pregunta');

    if (!contenedor) {
        return;
    }

    if (preguntaActual >= PREGUNTAS.length) {
        finalizarCronometroSiTerminado();

        contenedor.innerHTML = `
            <p><strong>Has terminado las preguntas de memoria RAM.</strong></p>
            <p>Ahora puedes continuar con el almacenamiento.</p>
            <p><strong>Aciertos totales:</strong> ${calcularCorrectas()}</p>
            <p><strong>Preguntas respondidas en total:</strong> ${calcularRespondidas()}</p>
            <p><strong>Tiempo empleado:</strong> ${formatearTiempo(obtenerTiempoRetoSegundos())}</p>
        `;

        actualizarPuntuacion();

        return;
    }

    const pregunta = PREGUNTAS[preguntaActual];
    const clave = idPregunta(preguntaActual);
    const respuestaGuardada = progreso[clave];
    const yaRespondida = respuestaGuardada !== undefined;
    const ordenOpciones = obtenerOrdenOpciones(preguntaActual);

    let html = `
        <p><strong>Pregunta ${preguntaActual + 1} de ${PREGUNTAS.length}:</strong></p>
        <p>${pregunta.texto}</p>
    `;

    ordenOpciones.forEach(function (indiceOriginal) {
        const opcion = pregunta.opciones[indiceOriginal];

        let clases = 'opcion';

        if (yaRespondida && opcion.correcta) {
            clases += ' correcta';
        }

        if (
            yaRespondida &&
            respuestaGuardada.elegida === indiceOriginal &&
            !opcion.correcta
        ) {
            clases += ' incorrecta';
        }

        html += `
            <button
                class="${clases}"
                onclick="responder(${indiceOriginal})"
                ${yaRespondida ? 'disabled' : ''}>
                ${opcion.texto}
            </button>
        `;
    });

    if (yaRespondida) {
        html += generarFeedback(pregunta, respuestaGuardada);
    }

    contenedor.innerHTML = html;
}

function responder(indiceElegido) {
    if (!alias) {
        alert('Primero escribe un alias para participar en el reto.');
        return;
    }

    const pregunta = PREGUNTAS[preguntaActual];
    const clave = idPregunta(preguntaActual);

    if (progreso[clave] !== undefined) {
        return;
    }

    const opcionElegida = pregunta.opciones[indiceElegido];
    const esCorrecta = opcionElegida.correcta === true;

    progreso[clave] = {
        elegida: indiceElegido,
        correcta: esCorrecta
    };

    guardarProgreso();

    cargarPregunta();
    actualizarPuntuacion();
}

function generarFeedback(pregunta, respuestaGuardada) {
    const opcionElegida = pregunta.opciones[respuestaGuardada.elegida];
    const opcionCorrecta = pregunta.opciones.find(function (opcion) {
        return opcion.correcta === true;
    });

    if (respuestaGuardada.correcta) {
        return `
            <div class="feedback correcto">
                ✅ <strong>¡Respuesta correcta!</strong><br><br>
                ${opcionElegida.feedbackCorrecto}
                <br>
                <span class="puntos-extra">+1 acierto</span>
            </div>
        `;
    }

    return `
        <div class="feedback incorrecto">
            ❌ <strong>Respuesta incorrecta.</strong><br><br>
            ${opcionElegida.feedbackIncorrecto}
            <br><br>
            ✅ <strong>La respuesta correcta era:</strong> ${opcionCorrecta.texto}
            <br><br>
            <strong>Explicación:</strong> ${opcionCorrecta.feedbackCorrecto}
        </div>
    `;
}

function siguientePregunta() {
    if (preguntaActual < PREGUNTAS.length) {
        preguntaActual++;
    }

    if (preguntaActual >= PREGUNTAS.length) {
        finalizarCronometroSiTerminado();
    }

    cargarPregunta();
    actualizarPuntuacion();
}

function reiniciarRetoActual() {
    if (!alias) {
        return;
    }

    const confirmar = confirm('¿Seguro que quieres reiniciar las respuestas de esta página para este alias?');

    if (!confirmar) {
        return;
    }

    Object.keys(progreso).forEach(function (clave) {
        if (clave.startsWith(COMPONENTE_ID + '-')) {
            delete progreso[clave];
        }
    });

    guardarProgreso();

    localStorage.removeItem(claveTiempoInicioAlias());
    localStorage.removeItem(claveTiempoFinalAlias());

    tiempoInicioReto = Date.now();
    tiempoFinalReto = 0;

    localStorage.setItem(claveTiempoInicioAlias(), String(tiempoInicioReto));

    preguntaActual = 0;
    ordenOpcionesPorPregunta = {};

    iniciarCronometroReto();

    cargarPregunta();
    actualizarPuntuacion();
}

function calcularCorrectas() {
    return Object.values(progreso).filter(function (respuesta) {
        return respuesta && respuesta.correcta === true;
    }).length;
}

function calcularRespondidas() {
    return Object.keys(progreso).length;
}

function actualizarPuntuacion() {
    const correctas = calcularCorrectas();
    const respondidas = calcularRespondidas();

    actualizarTexto('alias-visible', alias || '---');
    actualizarTexto('puntos-visible', correctas);

    actualizarTexto('alias-panel', alias || '---');
    actualizarTexto('correctas-panel', correctas);
    actualizarTexto('respondidas-panel', respondidas);

    actualizarCronometroVisible();

    guardarRankingLocal(correctas, respondidas);
}

function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerText = valor;
    }
}

function guardarRankingLocal(correctas, respondidas) {
    if (!alias) {
        console.warn('No se guarda ranking porque no hay alias.');
        return;
    }

    const tiempoSegundos = obtenerTiempoRetoSegundos();

    const ranking = JSON.parse(localStorage.getItem('fp_ranking_local') || '{}');

    ranking[alias] = {
        alias: alias,
        correctas: correctas,
        respondidas: respondidas,
        tiempoSegundos: tiempoSegundos,
        tiempoTexto: formatearTiempo(tiempoSegundos),
        fecha: new Date().toISOString()
    };

    localStorage.setItem('fp_ranking_local', JSON.stringify(ranking));

    enviarRankingFirebaseDirecto(alias, correctas, respondidas);
}

function enviarRankingFirebaseDirecto(aliasEnviar, correctas, respondidas) {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK no está cargado. Revisa los scripts del index.html.');
        return;
    }

    if (!window.rankingDB) {
        try {
            if (firebase.apps.length > 0) {
                window.rankingDB = firebase.database();
                console.log('window.rankingDB creado desde app.js.');
            }
        } catch (error) {
            console.error('No se ha podido crear window.rankingDB:', error);
            return;
        }
    }

    if (!window.rankingDB) {
        console.error('Firebase Database no está disponible. Revisa ../../firebase-config.js.');
        return;
    }

    if (!aliasEnviar || aliasEnviar.trim().length < 2) {
        console.error('Alias no válido.');
        return;
    }

    const aliasLimpio = aliasEnviar.trim().substring(0, 18);
    const aliasId = normalizarAliasParaFirebase(aliasLimpio);

    const aciertos = Number(correctas || 0);
    const contestadas = Number(respondidas || 0);
    const errores = Math.max(0, contestadas - aciertos);
    const porcentaje = contestadas > 0
        ? Math.round((aciertos / contestadas) * 100)
        : 0;

    const tiempoSegundos = obtenerTiempoRetoSegundos();

    const datos = {
        alias: aliasLimpio,
        correctas: aciertos,
        respondidas: contestadas,
        errores: errores,
        porcentaje: porcentaje,
        tiempoSegundos: tiempoSegundos,
        tiempoTexto: formatearTiempo(tiempoSegundos),
        fecha: new Date().toISOString()
    };

    window.rankingDB
        .ref(RUTA_RANKING_FIREBASE_DIRECTO + '/' + aliasId)
        .set(datos)
        .then(function () {
            console.log('✅ Ranking guardado correctamente en Firebase.');
        })
        .catch(function (error) {
            console.error('❌ Error guardando ranking en Firebase:', error);
        });
}

function normalizarAliasParaFirebase(texto) {
    return encodeURIComponent(
        texto
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
    );
}

function mostrarRankingLocal() {
    const ranking = JSON.parse(localStorage.getItem('fp_ranking_local') || '{}');
    const lista = Object.values(ranking);

    lista.sort(function (a, b) {
        if (b.correctas !== a.correctas) {
            return b.correctas - a.correctas;
        }

        const erroresA = Math.max(0, Number(a.respondidas || 0) - Number(a.correctas || 0));
        const erroresB = Math.max(0, Number(b.respondidas || 0) - Number(b.correctas || 0));

        if (erroresA !== erroresB) {
            return erroresA - erroresB;
        }

        const tiempoA = Number(a.tiempoSegundos || 999999);
        const tiempoB = Number(b.tiempoSegundos || 999999);

        if (tiempoA !== tiempoB) {
            return tiempoA - tiempoB;
        }

        return Number(b.respondidas || 0) - Number(a.respondidas || 0);
    });

    const contenedor = document.getElementById('ranking-contenido');

    if (!contenedor) {
        return;
    }

    if (lista.length === 0) {
        contenedor.innerHTML = '<p>Todavía no hay participantes guardados en este dispositivo.</p>';
        return;
    }

    let html = '';

    lista.forEach(function (item, indice) {
        html += `
            <div class="fila-ranking">
                <span>${indice + 1}. ${item.alias}</span>
                <strong>${item.correctas} aciertos · ${item.tiempoTexto || '--:--'}</strong>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}