/* ============================================================
   APP.JS - COMPONENTE MEMORIA RAM
   Feria FP Bajo Aragón - Hardware RA

   - Preguntas exclusivas de memoria RAM.
   - Admin: feriadelafp.
   - Total reto completo: 50 preguntas.
   - El tiempo empieza al escribir alias.
   - El tiempo NO se detiene al terminar este bloque.
   - El tiempo solo se detiene cuando se han respondido 50 preguntas.
   - Ranking: más aciertos -> menor tiempo.
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

const ALIAS_ADMIN = 'feriadelafp';
const TOTAL_PREGUNTAS_RETO = 50;

/* ============================================================
   PREGUNTAS EXCLUSIVAS DE MEMORIA RAM
   ============================================================ */

const NOMBRE_COMPONENTE = 'Memoria RAM';

const MENSAJE_MARCADOR_DETECTADO = '✅ Marcador detectado. Explora la memoria RAM.';
const MENSAJE_MARCADOR_PERDIDO = 'Enfoca de nuevo el marcador de la memoria RAM.';
const MENSAJE_FINAL = 'Has terminado las preguntas de memoria RAM.';
const SIGUIENTE_COMPONENTE = 'Ahora puedes continuar con el almacenamiento SSD.';

const PREGUNTAS = [
    {
        texto: '¿Cuál es la función principal de la memoria RAM?',
        opciones: [
            {
                texto: 'Guardar temporalmente datos e instrucciones mientras el equipo está encendido',
                correcta: true,
                feedbackCorrecto: 'Correcto. La RAM almacena temporalmente los datos que necesitan la CPU y los programas en ejecución.'
            },
            {
                texto: 'Guardar archivos de forma permanente aunque el ordenador esté apagado',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Esa función corresponde a unidades de almacenamiento como HDD o SSD.'
            },
            {
                texto: 'Transformar corriente eléctrica para alimentar el equipo',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Esa función corresponde a la fuente de alimentación.'
            }
        ]
    },
    {
        texto: '¿Qué ocurre con los datos de la RAM cuando se apaga el ordenador?',
        opciones: [
            {
                texto: 'Se pierden porque la RAM es memoria volátil',
                correcta: true,
                feedbackCorrecto: 'Muy bien. La RAM necesita energía eléctrica para conservar la información.'
            },
            {
                texto: 'Se guardan permanentemente en la propia RAM',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM no conserva los datos al apagar el equipo.'
            },
            {
                texto: 'Se imprimen automáticamente',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. Apagar el ordenador no imprime los datos de la RAM.'
            }
        ]
    },
    {
        texto: '¿Dónde se instala normalmente la memoria RAM en un ordenador de sobremesa?',
        opciones: [
            {
                texto: 'En las ranuras DIMM de la placa base',
                correcta: true,
                feedbackCorrecto: 'Correcto. Los módulos de RAM de sobremesa se insertan en las ranuras DIMM de la placa base.'
            },
            {
                texto: 'En el socket de la CPU',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. El socket de la placa base está reservado para el procesador.'
            },
            {
                texto: 'En el conector SATA de datos',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. SATA de datos se utiliza para conectar unidades de almacenamiento.'
            }
        ]
    },
    {
        texto: '¿Qué puede ocurrir si un equipo tiene poca memoria RAM?',
        opciones: [
            {
                texto: 'Puede funcionar más lento al abrir varios programas o muchas pestañas',
                correcta: true,
                feedbackCorrecto: 'Correcto. Si falta RAM, el sistema puede usar almacenamiento como apoyo, lo que suele ser más lento.'
            },
            {
                texto: 'La fuente de alimentación deja de convertir corriente',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La fuente no depende directamente de la cantidad de RAM instalada.'
            },
            {
                texto: 'El monitor pierde resolución automáticamente',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La resolución depende del monitor, la GPU y la configuración del sistema.'
            }
        ]
    },
    {
        texto: '¿Qué significa Dual Channel en memoria RAM?',
        opciones: [
            {
                texto: 'Que el sistema puede usar dos canales de memoria para mejorar el ancho de banda',
                correcta: true,
                feedbackCorrecto: 'Muy bien. Dual Channel permite que la CPU acceda a la memoria usando dos canales, lo que puede mejorar el rendimiento.'
            },
            {
                texto: 'Que la RAM sustituye a la tarjeta gráfica',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM no sustituye a una GPU dedicada.'
            },
            {
                texto: 'Que la RAM se conecta por HDMI',
                correcta: false,
                feedbackIncorrecto: 'No es correcto. La RAM se instala en ranuras DIMM, no en HDMI.'
            }
        ]
    }
];

/* ============================================================
   VARIABLES
   ============================================================ */

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

/* ============================================================
   INICIO
   ============================================================ */

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

/* ============================================================
   ADMINISTRADOR
   ============================================================ */

function esAdministrador() {
    return alias && alias.trim().toLowerCase() === ALIAS_ADMIN;
}

function actualizarBotonRankingAdmin() {
    const botonRanking = document.querySelector('.ranking-link');

    if (!botonRanking) {
        return;
    }

    botonRanking.style.display = esAdministrador() ? '' : 'none';
}

/* ============================================================
   FIREBASE Y RANKING
   ============================================================ */

function comprobarFirebaseComponente() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK no está cargado.');
        return;
    }

    if (!window.rankingDB) {
        console.warn('window.rankingDB no existe. Revisa firebase-config.js.');
        return;
    }

    window.rankingDB.ref('.info/connected').on('value', function (snapshot) {
        console.log('Firebase conectado:', snapshot.val());
    });
}

function enviarRankingFirebaseDirecto(aliasEnviar, correctas, respondidas) {
    if (typeof firebase === 'undefined') {
        return;
    }

    if (!window.rankingDB) {
        try {
            if (firebase.apps.length > 0) {
                window.rankingDB = firebase.database();
            }
        } catch (error) {
            console.error('No se ha podido crear window.rankingDB:', error);
            return;
        }
    }

    if (!window.rankingDB) {
        return;
    }

    if (!aliasEnviar || aliasEnviar.trim().length < 2) {
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
        retoCompletado: contestadas >= TOTAL_PREGUNTAS_RETO,
        totalPreguntasReto: TOTAL_PREGUNTAS_RETO,
        fecha: new Date().toISOString()
    };

    window.rankingDB
        .ref(RUTA_RANKING_FIREBASE_DIRECTO + '/' + aliasId)
        .set(datos)
        .catch(function (error) {
            console.error('Error guardando ranking en Firebase:', error);
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

/* ============================================================
   REINICIO REMOTO
   ============================================================ */

function escucharReinicioRemoto() {
    if (!window.rankingDB) {
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

/* ============================================================
   CRONÓMETRO GLOBAL DEL RETO
   ============================================================ */

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

    if (tiempoFinalReto === 0) {
        intervaloCronometro = setInterval(function () {
            actualizarCronometroVisible();
        }, 1000);
    }

    actualizarCronometroVisible();
}

function finalizarCronometroReto() {
    if (!alias) {
        return;
    }

    if (tiempoFinalReto > 0) {
        return;
    }

    tiempoFinalReto = Date.now();
    localStorage.setItem(claveTiempoFinalAlias(), String(tiempoFinalReto));

    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }

    actualizarCronometroVisible();
}

function finalizarCronometroSiTerminado() {
    if (!alias) {
        return;
    }

    if (calcularRespondidas() < TOTAL_PREGUNTAS_RETO) {
        return;
    }

    finalizarCronometroReto();
}

function obtenerTiempoRetoSegundos() {
    if (!alias || !tiempoInicioReto) {
        return 0;
    }

    const fin = tiempoFinalReto > 0 ? tiempoFinalReto : Date.now();

    return Math.max(0, Math.floor((fin - tiempoInicioReto) / 1000));
}

function formatearTiempo(segundosTotales) {
    const segundosValidos = Number(segundosTotales || 0);
    const minutos = Math.floor(segundosValidos / 60);
    const segundos = segundosValidos % 60;

    return String(minutos).padStart(2, '0') + ':' + String(segundos).padStart(2, '0');
}

function actualizarCronometroVisible() {
    const segundos = obtenerTiempoRetoSegundos();
    const texto = formatearTiempo(segundos);

    actualizarTexto('tiempo-visible', texto);
    actualizarTexto('tiempo-panel', texto);
}

/* ============================================================
   MODELO 3D
   ============================================================ */

function leerConfiguracionDesdeURL() {
    const parametros = new URLSearchParams(window.location.search);

    const escalaURL = parametros.get('escala');
    const pasoURL = parametros.get('paso');

    if (escalaURL !== null && !isNaN(parseFloat(escalaURL))) {
        CONFIG_LOCAL.escalaInicial = parseFloat(escalaURL);
    }

    if (pasoURL !== null && !isNaN(parseFloat(pasoURL))) {
        CONFIG_LOCAL.pasoEscala = parseFloat(pasoURL);
    }

    ['x', 'y', 'z'].forEach(function (eje) {
        const pos = parametros.get('pos' + eje.toUpperCase());
        const rot = parametros.get('rot' + eje.toUpperCase());

        if (pos !== null && !isNaN(parseFloat(pos))) {
            CONFIG_LOCAL.posicionInicial[eje] = parseFloat(pos);
        }

        if (rot !== null && !isNaN(parseFloat(rot))) {
            CONFIG_LOCAL.rotacionInicial[eje] = parseFloat(rot);
        }
    });

    escalaActual = CONFIG_LOCAL.escalaInicial;
    rotacionX = CONFIG_LOCAL.rotacionInicial.x;
    rotacionY = CONFIG_LOCAL.rotacionInicial.y;
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
        aviso.innerHTML = MENSAJE_MARCADOR_DETECTADO;
        aviso.style.display = 'block';
    });

    marcador.addEventListener('markerLost', function () {
        aviso.innerHTML = MENSAJE_MARCADOR_PERDIDO;
        aviso.style.display = 'block';
    });
}

/* ============================================================
   ALIAS
   ============================================================ */

function normalizarAlias(texto) {
    return encodeURIComponent(texto.trim().toLowerCase());
}

function claveProgresoAlias() {
    return 'fp_progreso_' + normalizarAlias(alias);
}

function iniciarAlias() {
    const modal = document.getElementById('modal-alias');

    if (alias.trim() !== '') {
        if (modal) {
            modal.style.display = 'none';
        }

        actualizarTexto('alias-visible', alias);
    } else {
        if (modal) {
            modal.style.display = 'flex';
        }

        actualizarTexto('alias-visible', '---');
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

/* ============================================================
   PREGUNTAS
   ============================================================ */

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

        const respondidasTotales = calcularRespondidas();
        const quedan = Math.max(0, TOTAL_PREGUNTAS_RETO - respondidasTotales);

        let bloqueTiempo = '';

        if (respondidasTotales >= TOTAL_PREGUNTAS_RETO) {
            bloqueTiempo = `
                <p><strong>✅ Reto completo finalizado.</strong></p>
                <p><strong>Tiempo final:</strong> ${formatearTiempo(obtenerTiempoRetoSegundos())}</p>
            `;
        } else {
            bloqueTiempo = `
                <p><strong>Tiempo actual:</strong> ${formatearTiempo(obtenerTiempoRetoSegundos())}</p>
                <p><strong>Preguntas restantes:</strong> ${quedan}</p>
                <p>Continúa con el siguiente componente. El cronómetro seguirá contando.</p>
            `;
        }

        contenedor.innerHTML = `
            <p><strong>${MENSAJE_FINAL}</strong></p>
            <p>${SIGUIENTE_COMPONENTE}</p>
            <p><strong>Aciertos totales:</strong> ${calcularCorrectas()}</p>
            <p><strong>Preguntas respondidas en total:</strong> ${respondidasTotales} / ${TOTAL_PREGUNTAS_RETO}</p>
            ${bloqueTiempo}
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

        if (yaRespondida && respuestaGuardada.elegida === indiceOriginal && !opcion.correcta) {
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

    if (calcularRespondidas() >= TOTAL_PREGUNTAS_RETO) {
        finalizarCronometroReto();
    }

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

/* ============================================================
   PUNTUACIÓN
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
    actualizarTexto('respondidas-panel', respondidas + ' / ' + TOTAL_PREGUNTAS_RETO);

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
        retoCompletado: respondidas >= TOTAL_PREGUNTAS_RETO,
        totalPreguntasReto: TOTAL_PREGUNTAS_RETO,
        fecha: new Date().toISOString()
    };

    localStorage.setItem('fp_ranking_local', JSON.stringify(ranking));

    enviarRankingFirebaseDirecto(alias, correctas, respondidas);
}

function mostrarRankingLocal() {
    const ranking = JSON.parse(localStorage.getItem('fp_ranking_local') || '{}');
    const lista = Object.values(ranking);

    lista.sort(function (a, b) {
        if (b.correctas !== a.correctas) {
            return b.correctas - a.correctas;
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
        const completado = item.retoCompletado ? ' · completo' : ' · en curso';

        html += `
            <div class="fila-ranking">
                <span>${indice + 1}. ${item.alias}</span>
                <strong>${item.correctas} aciertos · ${item.tiempoTexto || '--:--'}${completado}</strong>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

/* ============================================================
   PANELES
   ============================================================ */

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