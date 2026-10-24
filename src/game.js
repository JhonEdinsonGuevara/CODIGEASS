const MAX_HEARTS = 5;
const HEART_RECOVERY_MS = 30 * 60 * 1000;
const DAILY_GOAL = 2;
const DAILY_REWARD = 25;

const LESSONS = [
    {
        id: "sintaxis",
        title: "Sintaxis de Python",
        explanation: "La instrucción print() muestra un mensaje en la pantalla. Por ejemplo: print('Hola').",
        question: "¿Qué mensaje muestra print('Hola')?",
        answers: ["hola"],
        reward: 50
    },
    {
        id: "condicionales",
        title: "Condicionales",
        explanation: "Una condición permite tomar decisiones. Si 5 es mayor que 3, la condición es verdadera.",
        question: "¿La condición 5 > 3 es verdadera o falsa?",
        answers: ["verdadera", "verdadero", "true", "si"],
        reward: 50
    },
    {
        id: "bucles",
        title: "Bucles",
        explanation: "range(3) genera tres valores: 0, 1 y 2. El bloque del bucle se ejecuta una vez por cada valor.",
        question: "¿Cuántas veces se ejecuta for numero in range(3)?",
        answers: ["3", "tres"],
        reward: 50
    },
    {
        id: "funciones",
        title: "Funciones",
        explanation: "En Python, la palabra def inicia la definición de una función.",
        question: "¿Qué palabra se usa para definir una función en Python?",
        answers: ["def"],
        reward: 75
    },
    {
        id: "clases",
        title: "Clases",
        explanation: "Una clase describe una estructura para crear objetos. En Python, se declara con la palabra class.",
        question: "¿Qué palabra se usa para declarar una clase en Python?",
        answers: ["class"],
        reward: 75
    }
];

const CHALLENGES = {
    invertir: {
        title: "Invertir una cadena",
        explanation: "Al recorrer el texto desde el último carácter hasta el primero, puedes invertir su orden.",
        question: "¿Cuál es el texto 'casa' escrito al revés?",
        answers: ["asac"],
        reward: 50
    },
    busqueda: {
        title: "Búsqueda binaria",
        explanation: "En Python, las posiciones de una lista empiezan en cero. La búsqueda binaria reduce a la mitad el rango en cada paso.",
        question: "En [1, 3, 5, 7, 9], ¿qué índice ocupa el número 7? (empieza en 0)",
        answers: ["3"],
        reward: 100
    },
    optimizacion: {
        title: "Optimización de memoria",
        explanation: "Si visitas cada elemento de una lista una sola vez, el trabajo crece proporcionalmente al número de elementos.",
        question: "¿Qué complejidad representa recorrer una lista una sola vez?",
        answers: ["o(n)", "on", "n", "lineal"],
        reward: 200
    }
};

const SHOP_ITEMS = {
    hearts: { price: 300 },
    "double-xp": { price: 400 },
    ninja: { price: 800 },
    "cyber-title": { price: 1000 }
};

function getLocalDate(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function createInitialProgress(joinedAt = new Date().toISOString()) {
    const now = Date.now();
    return {
        version: 1,
        xp: 0,
        hearts: MAX_HEARTS,
        streak: 0,
        lastActivityDate: null,
        joinedAt,
        heartUpdatedAt: now,
        completedLessons: [],
        completedChallenges: [],
        dailyDate: getLocalDate(now),
        dailyActivities: 0,
        dailyRewardClaimed: false,
        inventory: {
            doubleXpUntil: null,
            ninja: false,
            cyberTitle: false
        }
    };
}

function normalizeAnswer(answer) {
    return answer
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es")
        .replace(/\s+/g, "")
        .replace(/[.,;:!?]/g, "");
}

function getPublicContent() {
    const sanitize = (activity, id) => ({
        id,
        title: activity.title,
        explanation: activity.explanation,
        question: activity.question,
        reward: activity.reward
    });

    return {
        lessons: LESSONS.map((lesson, index) => ({
            ...sanitize(lesson, lesson.id),
            order: index + 1
        })),
        challenges: Object.entries(CHALLENGES).map(([id, challenge]) => sanitize(challenge, id))
    };
}

function refreshProgress(progress, now = Date.now()) {
    const next = structuredClone(progress);
    let changed = false;

    if (next.dailyDate !== getLocalDate(now)) {
        next.dailyDate = getLocalDate(now);
        next.dailyActivities = 0;
        next.dailyRewardClaimed = false;
        changed = true;
    }

    if (next.hearts < MAX_HEARTS) {
        const recovered = Math.floor((now - next.heartUpdatedAt) / HEART_RECOVERY_MS);
        if (recovered > 0) {
            next.hearts = Math.min(MAX_HEARTS, next.hearts + recovered);
            next.heartUpdatedAt = next.hearts === MAX_HEARTS
                ? now
                : next.heartUpdatedAt + recovered * HEART_RECOVERY_MS;
            changed = true;
        }
    } else if (now - next.heartUpdatedAt > HEART_RECOVERY_MS) {
        next.heartUpdatedAt = now;
        changed = true;
    }

    return { progress: next, changed };
}

function recordActivity(progress, now) {
    const today = getLocalDate(now);
    if (progress.dailyDate !== today) {
        progress.dailyDate = today;
        progress.dailyActivities = 0;
        progress.dailyRewardClaimed = false;
    }

    if (progress.lastActivityDate !== today) {
        const previous = progress.lastActivityDate
            ? new Date(`${progress.lastActivityDate}T00:00:00`)
            : null;
        const current = new Date(`${today}T00:00:00`);
        const daysSinceActivity = previous
            ? Math.round((current.getTime() - previous.getTime()) / 86400000)
            : null;
        progress.streak = daysSinceActivity === 1 ? progress.streak + 1 : 1;
        progress.lastActivityDate = today;
    }

    progress.dailyActivities += 1;
}

function processAnswer(progress, { type, id, answer }, now = Date.now()) {
    const next = structuredClone(progress);
    const activity = type === "lesson"
        ? LESSONS.find(item => item.id === id)
        : type === "challenge"
            ? CHALLENGES[id]
            : null;

    if (!activity) {
        return { status: 400, body: { error: "La actividad solicitada no existe." }, progress: next };
    }
    if (next.hearts === 0) {
        return { status: 429, body: { error: "No tienes vidas disponibles. Recuperas una cada 30 minutos." }, progress: next };
    }

    const completedIds = type === "lesson" ? next.completedLessons : next.completedChallenges;
    if (completedIds.includes(id)) {
        return { status: 409, body: { error: "Esta actividad ya está completada." }, progress: next };
    }

    if (type === "lesson") {
        const firstIncomplete = LESSONS.find(item => !next.completedLessons.includes(item.id));
        if (firstIncomplete?.id !== id) {
            return { status: 409, body: { error: "Completa las lecciones anteriores antes de continuar." }, progress: next };
        }
    }

    const isCorrect = activity.answers.includes(normalizeAnswer(answer));
    if (!isCorrect) {
        next.hearts -= 1;
        next.heartUpdatedAt = now;
        return {
            status: 200,
            progress: next,
            body: {
                correct: false,
                message: next.hearts === 0
                    ? "No es correcto. Te quedaste sin vidas; recuperas una en 30 minutos."
                    : `No es correcto. Te quedan ${next.hearts} ${next.hearts === 1 ? "vida" : "vidas"}.`,
                progress: next
            }
        };
    }

    completedIds.push(id);
    const doubleXpActive = next.inventory.doubleXpUntil !== null && next.inventory.doubleXpUntil > now;
    const multiplier = doubleXpActive ? 2 : 1;
    const activityXp = activity.reward * multiplier;
    next.xp += activityXp;
    recordActivity(next, now);

    const missionXp = next.dailyActivities >= DAILY_GOAL && !next.dailyRewardClaimed
        ? DAILY_REWARD * multiplier
        : 0;
    if (missionXp > 0) {
        next.xp += missionXp;
        next.dailyRewardClaimed = true;
    }

    const message = missionXp > 0
        ? `¡Correcto! Ganaste ${activityXp} XP y ${missionXp} XP por la misión diaria.`
        : `¡Correcto! Ganaste ${activityXp} XP.`;

    return {
        status: 200,
        progress: next,
        body: {
            correct: true,
            message,
            activityXp,
            missionXp,
            progress: next
        }
    };
}

function processPurchase(progress, itemId, now = Date.now()) {
    const next = structuredClone(progress);
    const item = SHOP_ITEMS[itemId];
    if (!item) {
        return { status: 400, body: { error: "Este artículo no está disponible." }, progress: next };
    }
    if (next.xp < item.price) {
        return { status: 400, body: { error: "No tienes suficientes XP para esta compra." }, progress: next };
    }
    if (itemId === "hearts" && next.hearts === MAX_HEARTS) {
        return { status: 409, body: { error: "Ya tienes todas tus vidas." }, progress: next };
    }
    if (itemId === "double-xp" && next.inventory.doubleXpUntil > now) {
        return { status: 409, body: { error: "El multiplicador de XP ya está activo." }, progress: next };
    }
    if (itemId === "ninja" && next.inventory.ninja) {
        return { status: 409, body: { error: "Ya tienes este avatar." }, progress: next };
    }
    if (itemId === "cyber-title" && next.inventory.cyberTitle) {
        return { status: 409, body: { error: "Ya tienes este título." }, progress: next };
    }

    next.xp -= item.price;
    if (itemId === "hearts") {
        next.hearts = MAX_HEARTS;
        next.heartUpdatedAt = now;
    } else if (itemId === "double-xp") {
        next.inventory.doubleXpUntil = now + 60 * 60 * 1000;
    } else if (itemId === "ninja") {
        next.inventory.ninja = true;
    } else {
        next.inventory.cyberTitle = true;
    }

    const messages = {
        hearts: "Compra realizada: recuperaste todas tus vidas.",
        "double-xp": "Compra realizada: ganarás el doble de XP durante una hora.",
        ninja: "Compra realizada: desbloqueaste el avatar Code Ninja.",
        "cyber-title": "Compra realizada: desbloqueaste el título Cyber Dev."
    };
    return {
        status: 200,
        progress: next,
        body: {
            message: messages[itemId],
            progress: next
        }
    };
}

module.exports = {
    CHALLENGES,
    DAILY_GOAL,
    LESSONS,
    MAX_HEARTS,
    SHOP_ITEMS,
    createInitialProgress,
    getLocalDate,
    getPublicContent,
    normalizeAnswer,
    processAnswer,
    processPurchase,
    refreshProgress
};
