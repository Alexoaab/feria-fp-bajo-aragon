/* ============================================================
   APP.JS - COMPONENTE REFRIGERACIÓN
   Feria FP Bajo Aragón - Hardware RA + Ranking Firebase
   ============================================================ */

const CONFIG_LOCAL = typeof CONFIG_AR !== 'undefined'
    ? CONFIG_AR
    : {
        componenteId: 'refrigeracion',
        escalaInicial: 1,
        escalaMinima: 0.005,
        pasoEscala: 0.05,
        posicionInicial: { x: 0, y: 0.2, z: 0 },
        rotacionInicial: { x: 0, y: 0, z: 0 }
    };

const COMPONENTE_ID = CONFIG_LOCAL.componenteId || 'refrigeracion';
const RUTA_RANKING_FIREBASE_DIRECTO = 'rankingFeriaFPBajoAragon';

const PREGUNTAS = [
    {
        texto: '¿Para qué sirve principalmente la refrigeración en un ordenador?',
        opciones: [
            {
                texto: 'Para controlar la temperatura de los componentes',
                correcta: true,
                feedbackCorrecto: 'Correcto. La refrigeración evita que componentes como CPU y GPU alcancen temperaturas demasiado altas.'
            },
            {
                texto: 'Para guardar documentos y fotos',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Los documentos y fotos se guardan en un disco duro o SSD.'
            },
            {
                texto: 'Para conectar el monitor al ordenador',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El monitor se conecta mediante cables de vídeo como HDMI o DisplayPort.'
            }
        ]
    },
    {
        texto: '¿Qué componente se coloca normalmente encima de la CPU para retirar calor?',
        opciones: [
            {
                texto: 'El disipador',
                correcta: true,
                feedbackCorrecto: 'Muy bien. El disipador ayuda a absorber y repartir el calor generado por el procesador.'
            },
            {
                texto: 'El disco duro',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El disco duro sirve para almacenar datos, no para refrigerar la CPU.'
            },
            {
                texto: 'El teclado',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El teclado es un periférico externo de entrada.'
            }
        ]
    },
    {
        texto: '¿Qué se suele aplicar entre la CPU y el disipador?',
        opciones: [
            {
                texto: 'Pasta térmica',
                correcta: true,
                feedbackCorrecto: 'Correcto. La pasta térmica mejora la transferencia de calor entre el procesador y el disipador.'
            },
            {
                texto: 'Cable SATA',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El cable SATA se usa para datos de discos duros o SSD SATA.'
            },
            {
                texto: 'Memoria RAM',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM se coloca en ranuras DIMM de la placa base.'
            }
        ]
    },
    {
        texto: '¿Dónde debe conectarse normalmente el ventilador del procesador?',
        opciones: [
            {
                texto: 'Al conector CPU_FAN de la placa base',
                correcta: true,
                feedbackCorrecto: 'Muy bien. El conector CPU_FAN permite alimentar y controlar el ventilador del procesador.'
            },
            {
                texto: 'Al puerto HDMI del monitor',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. HDMI sirve para vídeo y sonido, no para ventiladores internos.'
            },
            {
                texto: 'A una ranura de memoria RAM',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Las ranuras de RAM son para módulos de memoria.'
            }
        ]
    },
    {
        texto: '¿Qué puede ocurrir si un ordenador se calienta demasiado?',
        opciones: [
            {
                texto: 'Puede reducir su rendimiento o apagarse para protegerse',
                correcta: true,
                feedbackCorrecto: 'Correcto. Si la temperatura sube demasiado, el sistema puede bajar el rendimiento o apagarse para evitar daños.'
            },
            {
                texto: 'Aumenta automáticamente la capacidad del disco',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La temperatura no aumenta la capacidad de almacenamiento.'
            },
            {
                texto: 'El teclado empieza a funcionar sin cables',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El calor no convierte un teclado con cable en inalámbrico.'
            }
        ]
    }
];

let escalaActual = CONFIG_LOCAL.escalaInicial;
let rotacionY = CONFIG_LOCAL.rotacionInicial.y;
let preguntaActual = 0;

let alias = localStorage.getItem('fp_alias') || '';
let progreso = {};

// Orden aleatorio de respuestas.
// Se mantiene mientras la página está abierta para que las opciones no cambien cada vez que se repinta la pregunta.
let ordenOpcionesPorPregunta = {};

window.addEventListener('load', function () {
    cargarEscalaGuardada();
    leerConfiguracionDesdeURL();

    iniciarAlias();
    cargarProgreso();

    preguntaActual = buscarPrimeraPreguntaPendiente();

    actualizarPuntuacion();
    cargarPregunta();

    reiniciarModelo(false);

    configurarEventosMarcador();
    configurarInputAlias();
    comprobarFirebaseComponente();
});

function comprobarFirebaseComponente() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK no está cargado en la página de refrigeración.');
        return;
    }

    if (!window.rankingDB) {
        console.warn('window.rankingDB no existe. Revisa ../../firebase-config.js.');
        return;
    }

    console.log('Firebase disponible en página refrigeración.');

    window.rankingDB.ref('.info/connected').on('value', function (snapshot) {
        console.log('Firebase conectado desde refrigeración:', snapshot.val());
    });
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

    if (!modelo) return;

    modelo.setAttribute('position', {
        x: CONFIG_LOCAL.posicionInicial.x,
        y: CONFIG_LOCAL.posicionInicial.y,
        z: CONFIG_LOCAL.posicionInicial.z
    });
}

function aplicarRotacionInicial() {
    const modelo = obtenerModelo();

    if (!modelo) return;

    modelo.setAttribute('rotation', {
        x: CONFIG_LOCAL.rotacionInicial.x,
        y: CONFIG_LOCAL.rotacionInicial.y,
        z: CONFIG_LOCAL.rotacionInicial.z
    });
}

function girarModelo() {
    marcarBotonTemporal('btn-girar');

    const modelo = obtenerModelo();

    if (!modelo) return;

    rotacionY += 30;

    modelo.setAttribute('rotation', {
        x: CONFIG_LOCAL.rotacionInicial.x,
        y: rotacionY,
        z: CONFIG_LOCAL.rotacionInicial.z
    });
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
    rotacionY = CONFIG_LOCAL.rotacionInicial.y;

    aplicarEscala(mostrarEfecto !== false);
    aplicarPosicionInicial();
    aplicarRotacionInicial();
}

function mostrarMensajeVisor(mensaje) {
    const aviso = document.getElementById('aviso');

    if (!aviso) return;

    aviso.innerHTML = mensaje;
    aviso.style.display = 'block';
}

function configurarEventosMarcador() {
    const marcador = document.querySelector('#markerA');
    const aviso = document.querySelector('#aviso');

    if (!marcador || !aviso) return;

    marcador.addEventListener('markerFound', function () {
        aviso.innerHTML = '✅ Marcador detectado. Explora el sistema de refrigeración.';
        aviso.style.display = 'block';
    });

    marcador.addEventListener('markerLost', function () {
        aviso.innerHTML = 'Enfoca de nuevo el marcador de refrigeración.';
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
    }
}

function configurarInputAlias() {
    const inputAlias = document.getElementById('alias-input');

    if (!inputAlias) return;

    inputAlias.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter') {
            guardarAlias();
        }
    });
}

function guardarAlias() {
    const input = document.getElementById('alias-input');

    if (!input) return;

    const valor = input.value.trim();

    if (valor.length < 2) {
        alert('Escribe un alias de al menos 2 caracteres.');
        return;
    }

    alias = valor.substring(0, 18);
    localStorage.setItem('fp_alias', alias);

    actualizarTexto('alias-visible', alias);

    const modal = document.getElementById('modal-alias');

    if (modal) {
        modal.style.display = 'none';
    }

    cargarProgreso();

    preguntaActual = buscarPrimeraPreguntaPendiente();

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
    if (!alias) return;

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

    if (!boton) return;

    boton.classList.add('boton-pulsado');

    setTimeout(function () {
        boton.classList.remove('boton-pulsado');
    }, 180);
}

/* ============================================================
   RETO CON RESPUESTAS ALEATORIAS
   ============================================================ */

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

    if (!contenedor) return;

    if (preguntaActual >= PREGUNTAS.length) {
        contenedor.innerHTML = `
            <p><strong>Has terminado las preguntas de refrigeración.</strong></p>
            <p>Ahora puedes continuar con la memoria RAM.</p>
            <p><strong>Aciertos totales:</strong> ${calcularCorrectas()}</p>
            <p><strong>Preguntas respondidas en total:</strong> ${calcularRespondidas()}</p>
        `;
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

    cargarPregunta();
}

function reiniciarRetoActual() {
    if (!alias) return;

    const confirmar = confirm('¿Seguro que quieres reiniciar las respuestas de esta página para este alias?');

    if (!confirmar) return;

    Object.keys(progreso).forEach(function (clave) {
        if (clave.startsWith(COMPONENTE_ID + '-')) {
            delete progreso[clave];
        }
    });

    guardarProgreso();

    preguntaActual = 0;
    ordenOpcionesPorPregunta = {};

    cargarPregunta();
    actualizarPuntuacion();
}

/* ============================================================
   PUNTUACIÓN Y RANKING
   ============================================================ */

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

    const ranking = JSON.parse(localStorage.getItem('fp_ranking_local') || '{}');

    ranking[alias] = {
        alias: alias,
        correctas: correctas,
        respondidas: respondidas,
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

    const datos = {
        alias: aliasLimpio,
        correctas: aciertos,
        respondidas: contestadas,
        errores: errores,
        porcentaje: porcentaje,
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

        return a.respondidas - b.respondidas;
    });

    const contenedor = document.getElementById('ranking-contenido');

    if (!contenedor) return;

    if (lista.length === 0) {
        contenedor.innerHTML = '<p>Todavía no hay participantes guardados en este dispositivo.</p>';
        return;
    }

    let html = '';

    lista.forEach(function (item, indice) {
        html += `
            <div class="fila-ranking">
                <span>${indice + 1}. ${item.alias}</span>
                <strong>${item.correctas} aciertos</strong>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}