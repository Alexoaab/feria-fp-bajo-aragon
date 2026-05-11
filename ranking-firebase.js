const RUTA_RANKING_FIREBASE = 'rankingFeriaFPBajoAragon';

console.log('✅ ranking-firebase.js cargado en esta página');

function normalizarIdRanking(alias) {
    return encodeURIComponent(
        alias
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
    );
}

function calcularPorcentajeRanking(correctas, respondidas) {
    if (respondidas <= 0) {
        return 0;
    }

    return Math.round((correctas / respondidas) * 100);
}

function guardarRankingEnFirebase(alias, correctas, respondidas) {
    console.log('Intentando enviar puntuación a Firebase...');

    if (!window.rankingDB) {
        console.error('❌ Firebase no está disponible. Revisa firebase-config.js');
        return;
    }

    if (!alias || alias.trim().length < 2) {
        console.warn('Alias no válido. No se guarda ranking.');
        return;
    }

    const aliasLimpio = alias.trim().substring(0, 18);
    const aliasId = normalizarIdRanking(aliasLimpio);

    const aciertos = Number(correctas || 0);
    const contestadas = Number(respondidas || 0);
    const errores = Math.max(0, contestadas - aciertos);
    const porcentaje = calcularPorcentajeRanking(aciertos, contestadas);

    const datos = {
        alias: aliasLimpio,
        correctas: aciertos,
        respondidas: contestadas,
        errores: errores,
        porcentaje: porcentaje,
        fecha: new Date().toISOString()
    };

    console.log('📤 Datos enviados al ranking:', datos);

    return window.rankingDB
        .ref(RUTA_RANKING_FIREBASE + '/' + aliasId)
        .set(datos)
        .then(function () {
            console.log('✅ Puntuación guardada en Firebase correctamente');
        })
        .catch(function (error) {
            console.error('❌ Error al guardar puntuación en Firebase:', error);
        });
}