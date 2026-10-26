const MAX_HEARTS = 5;
const HEART_RECOVERY_MS = 30 * 60 * 1000;
const DAILY_GOAL = 2;
const DAILY_REWARD = 25;

const COURSES = [
    {
        id: "python",
        name: "Python",
        icon: "🐍",
        description: "Aprende lógica, estructuras de datos y automatización.",
        lessons: [
            {
                id: "sintaxis",
                title: "Sintaxis de Python",
                explanation: "print() puede mostrar el valor guardado en una variable. Escribe el nombre de la variable sin comillas para mostrar su contenido, no el texto literal.",
                question: "Después de ejecutar `mensaje = 'Ana'`, ¿qué argumento pasarías a print() para mostrar el valor guardado? Escribe solo el argumento.",
                answers: ["mensaje"],
                reward: 50
            },
            {
                id: "condicionales",
                title: "Condicionales",
                explanation: "Una comparación permite ejecutar un bloque solo cuando se cumple una condición. Para incluir el valor límite, usa el operador mayor o igual.",
                question: "Un programa debe mostrar 'Aprobado' cuando nota sea 60 o más. Completa la comparación: if nota ___ 60: Escribe solo el operador.",
                answers: [">="],
                reward: 50
            },
            {
                id: "bucles",
                title: "Bucles",
                explanation: "range(inicio, límite, paso) genera valores desde el inicio, avanzando por el paso, y se detiene antes de alcanzar el límite.",
                question: "En `for numero in range(2, 8, 2):`, ¿cuál es el último valor que toma numero? Escribe solo el número.",
                answers: ["6"],
                reward: 50
            },
            {
                id: "funciones",
                title: "Funciones",
                explanation: "Una función puede recibir un valor en un parámetro y devolver un resultado con return. Cuando la llamas, Python usa el valor que le enviaste para hacer el cálculo.",
                question: "La función `def doblar(numero): return numero * 2` se ejecuta como `doblar(6)`. ¿Qué valor devuelve?",
                answers: ["12"],
                reward: 75
            },
            {
                id: "clases",
                title: "Clases",
                explanation: "Una clase sirve como plantilla para crear objetos con datos y comportamientos relacionados, por ejemplo varios productos con nombre y precio.",
                question: "Un inventario debe crear muchos productos, cada uno con su propio nombre y precio, usando la misma plantilla. ¿Qué concepto de Python define esa plantilla?",
                answers: ["class"],
                reward: 75
            }
        ]
    },
    {
        id: "html",
        name: "HTML",
        icon: "🌐",
        description: "Aprende a estructurar páginas web con elementos HTML.",
        lessons: [
            {
                id: "estructura",
                title: "Estructura semántica",
                explanation: "Los elementos semánticos describen el propósito de cada sección, no su apariencia. Distingue el encabezado y la navegación del contenido central propio de la página.",
                question: "Una página ya tiene un encabezado y un menú de navegación. ¿Qué elemento semántico debería envolver el contenido principal y único de esa página? Escribe el nombre sin los signos <>.",
                answers: ["main"],
                reward: 50
            },
            {
                id: "enlaces",
                title: "Enlaces HTML",
                explanation: "Un enlace tiene un texto que las personas pueden leer y una dirección que el navegador abre al hacer clic. En el siguiente ejemplo debes completar la parte que conecta ambos.",
                question: "Completa el atributo para que este enlace abra la página de contacto: <a ___=\"/contacto\">Escríbenos</a>. Escribe solo el nombre del atributo.",
                answers: ["href"],
                reward: 50
            },
            {
                id: "imagenes",
                title: "Imágenes accesibles",
                explanation: "Cuando una imagen aporta información, las personas que no pueden verla necesitan una descripción breve. Una imagen que solo decora puede tener una descripción vacía.",
                question: "Una tienda muestra la foto de una taza azul con su logotipo. ¿Qué atributo de la imagen usarías para escribir una descripción útil para quien no puede verla? Escribe solo el nombre del atributo.",
                answers: ["alt"],
                reward: 50
            }
        ]
    },
    {
        id: "css",
        name: "CSS",
        icon: "🎨",
        description: "Da estilo a sitios web con colores, selectores y diseño.",
        lessons: [
            {
                id: "selectores",
                title: "Selectores CSS",
                explanation: "Un selector de tipo aplica estilos a todos los elementos HTML de ese tipo.",
                question: "¿Qué selector aplica estilos a todos los párrafos?",
                answers: ["p"],
                reward: 50
            },
            {
                id: "colores",
                title: "Colores CSS",
                explanation: "La propiedad color cambia el color del texto.",
                question: "¿Qué propiedad CSS cambia el color del texto?",
                answers: ["color"],
                reward: 50
            },
            {
                id: "diseno",
                title: "Diseño con Flexbox",
                explanation: "La propiedad display: flex activa Flexbox en un contenedor.",
                question: "¿Qué valor de la propiedad display activa Flexbox?",
                answers: ["flex"],
                reward: 50
            }
        ]
    },
    {
        id: "javascript",
        name: "JavaScript",
        icon: "⚡",
        description: "Agrega interactividad a páginas web y aprende sus fundamentos.",
        lessons: [
            {
                id: "variables",
                title: "Variables JavaScript",
                explanation: "La palabra const declara una variable que no se puede reasignar.",
                question: "¿Qué palabra declara una variable que no se puede reasignar?",
                answers: ["const"],
                reward: 50
            },
            {
                id: "consola",
                title: "Consola JavaScript",
                explanation: "console.log() escribe un valor en la consola para ayudar a revisar el programa.",
                question: "¿Qué método escribe un mensaje en la consola del navegador?",
                answers: ["console.log", "console.log()"],
                reward: 50
            },
            {
                id: "comparaciones",
                title: "Comparaciones JavaScript",
                explanation: "El operador === compara valores sin convertir sus tipos.",
                question: "¿Qué operador compara igualdad estricta en JavaScript?",
                answers: ["==="],
                reward: 50
            }
        ]
    },
    {
        id: "java",
        name: "Java",
        icon: "☕",
        description: "Explora clases, tipos de datos y fundamentos de Java.",
        lessons: [
            {
                id: "clases",
                title: "Clases Java",
                explanation: "En Java, la palabra class declara una clase.",
                question: "¿Qué palabra declara una clase en Java?",
                answers: ["class"],
                reward: 50
            },
            {
                id: "variables",
                title: "Variables Java",
                explanation: "En Java, int declara una variable que almacena un número entero.",
                question: "¿Qué tipo de Java se usa para almacenar un número entero?",
                answers: ["int"],
                reward: 50
            },
            {
                id: "metodos",
                title: "Método principal de Java",
                explanation: "El método main es el punto de entrada habitual de una aplicación Java.",
                question: "¿Cómo se llama el método de entrada habitual de una aplicación Java?",
                answers: ["main"],
                reward: 50
            }
        ]
    },
    {
        id: "csharp",
        name: "C#",
        icon: "🎯",
        description: "Conoce la sintaxis y los tipos básicos del lenguaje C#.",
        lessons: [
            {
                id: "variables",
                title: "Variables C#",
                explanation: "La palabra var permite que C# infiera el tipo de una variable al inicializarla.",
                question: "¿Qué palabra permite inferir el tipo de una variable local en C#?",
                answers: ["var"],
                reward: 50
            },
            {
                id: "clases",
                title: "Clases C#",
                explanation: "La palabra class declara una clase en C#.",
                question: "¿Qué palabra declara una clase en C#?",
                answers: ["class"],
                reward: 50
            },
            {
                id: "espacios",
                title: "Espacios de nombres C#",
                explanation: "La directiva using importa un espacio de nombres, por ejemplo using System;.",
                question: "¿Qué palabra inicia una directiva para importar un espacio de nombres en C#?",
                answers: ["using"],
                reward: 50
            }
        ]
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
        version: 2,
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
        courses: COURSES.map(course => ({
            id: course.id,
            name: course.name,
            icon: course.icon,
            description: course.description,
            lessons: course.lessons.map((lesson, index) => ({
                ...sanitize(lesson, lesson.id),
                order: index + 1
            }))
        })),
        challenges: Object.entries(CHALLENGES).map(([id, challenge]) => sanitize(challenge, id))
    };
}

function migrateProgress(progress) {
    const next = structuredClone(progress);
    let changed = false;

    if (next.version === 1) {
        next.completedLessons = next.completedLessons.map(id => id.includes(":") ? id : `python:${id}`);
        next.version = 2;
        changed = true;
    }

    return { progress: next, changed };
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

function processAnswer(progress, { type, id, courseId, answer }, now = Date.now()) {
    const migrated = migrateProgress(progress);
    const next = migrated.progress;
    const course = type === "lesson" ? COURSES.find(item => item.id === courseId) : null;
    const activity = type === "lesson"
        ? course?.lessons.find(item => item.id === id)
        : type === "challenge"
            ? CHALLENGES[id]
            : null;

    if (!activity) {
        return { status: 400, body: { error: "La actividad solicitada no existe." }, progress: next };
    }
    if (next.hearts === 0) {
        return { status: 429, body: { error: "No tienes vidas disponibles. Recuperas una cada 30 minutos." }, progress: next };
    }

    const completionId = type === "lesson" ? `${courseId}:${id}` : id;
    const completedIds = type === "lesson" ? next.completedLessons : next.completedChallenges;
    if (completedIds.includes(completionId)) {
        return { status: 409, body: { error: "Esta actividad ya está completada." }, progress: next };
    }

    const normalizedAnswer = normalizeAnswer(answer);
    const isCorrect = activity.answers.some(correctAnswer => normalizeAnswer(correctAnswer) === normalizedAnswer);
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

    completedIds.push(completionId);
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
    COURSES,
    DAILY_GOAL,
    MAX_HEARTS,
    SHOP_ITEMS,
    createInitialProgress,
    getLocalDate,
    getPublicContent,
    migrateProgress,
    normalizeAnswer,
    processAnswer,
    processPurchase,
    refreshProgress
};
