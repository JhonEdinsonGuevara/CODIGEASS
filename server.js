const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const session = require("express-session");
const helmet = require("helmet");
const {
    createInitialProgress,
    getPublicContent,
    migrateProgress,
    processAnswer,
    processPurchase,
    refreshProgress
} = require("./src/game");

const SESSION_COOKIE_NAME = "codigeass.sid";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const dummyPasswordHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), BCRYPT_ROUNDS);

function initializeDatabase(database) {
    database.exec(`
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL COLLATE NOCASE UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS progress (
            user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            state_json TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            session_json TEXT NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
    `);
    return database;
}

class SQLiteSessionStore extends session.Store {
    constructor(database) {
        super();
        this.database = database;
        this.getStatement = database.prepare("SELECT session_json, expires_at FROM sessions WHERE session_id = ?");
        this.setStatement = database.prepare(`
            INSERT INTO sessions (session_id, session_json, expires_at)
            VALUES (?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                session_json = excluded.session_json,
                expires_at = excluded.expires_at
        `);
        this.deleteStatement = database.prepare("DELETE FROM sessions WHERE session_id = ?");
        this.expiredStatement = database.prepare("DELETE FROM sessions WHERE expires_at <= ?");
    }

    get(sessionId, callback) {
        try {
            const now = Date.now();
            this.expiredStatement.run(now);
            const row = this.getStatement.get(sessionId);
            if (!row || row.expires_at <= now) {
                callback(null, null);
                return;
            }
            callback(null, JSON.parse(row.session_json));
        } catch (error) {
            callback(error);
        }
    }

    set(sessionId, sessionData, callback = () => {}) {
        try {
            const expiresAt = sessionData.cookie?.expires
                ? new Date(sessionData.cookie.expires).getTime()
                : Date.now() + SESSION_MAX_AGE;
            this.setStatement.run(sessionId, JSON.stringify(sessionData), expiresAt);
            callback(null);
        } catch (error) {
            callback(error);
        }
    }

    touch(sessionId, sessionData, callback = () => {}) {
        this.set(sessionId, sessionData, callback);
    }

    destroy(sessionId, callback = () => {}) {
        try {
            this.deleteStatement.run(sessionId);
            callback(null);
        } catch (error) {
            callback(error);
        }
    }
}

function createApp({ database, sessionSecret, publicDirectory = path.join(__dirname, "public"), secureCookies = false }) {
    if (!database) {
        throw new Error("A SQLite database connection is required.");
    }
    if (typeof sessionSecret !== "string" || sessionSecret.length < 32) {
        throw new Error("SESSION_SECRET must contain at least 32 characters.");
    }

    initializeDatabase(database);

    const app = express();
    const readUser = database.prepare("SELECT id, username, created_at FROM users WHERE id = ?");
    const findUserByUsername = database.prepare("SELECT id, username, password_hash, created_at FROM users WHERE username = ?");
    const insertUser = database.prepare("INSERT OR IGNORE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)");
    const insertProgress = database.prepare("INSERT INTO progress (user_id, state_json, updated_at) VALUES (?, ?, ?)");
    const getProgress = database.prepare("SELECT state_json FROM progress WHERE user_id = ?");
    const updateProgress = database.prepare("UPDATE progress SET state_json = ?, updated_at = ? WHERE user_id = ?");

    function saveProgress(userId, progress) {
        const result = updateProgress.run(JSON.stringify(progress), new Date().toISOString(), userId);
        if (result.changes !== 1) {
            throw new Error("The authenticated user's progress record is missing.");
        }
    }

    function readProgress(userId) {
        const row = getProgress.get(userId);
        if (!row) {
            throw new Error("The authenticated user's progress record is missing.");
        }
        const migrated = migrateProgress(JSON.parse(row.state_json));
        const refreshed = refreshProgress(migrated.progress);
        if (migrated.changed || refreshed.changed) {
            saveProgress(userId, refreshed.progress);
        }
        return refreshed.progress;
    }

    function startSession(request) {
        return new Promise((resolve, reject) => {
            request.session.regenerate(error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    function requireUser(request, response, next) {
        if (!request.session.userId) {
            response.status(401).json({ error: "Inicia sesión para continuar." });
            return;
        }
        const user = readUser.get(request.session.userId);
        if (!user) {
            request.session.destroy(() => {});
            response.status(401).json({ error: "La sesión ya no es válida. Inicia sesión de nuevo." });
            return;
        }
        request.user = user;
        next();
    }

    app.disable("x-powered-by");
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                baseUri: ["'self'"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "data:"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
                imgSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"]
            }
        },
        hsts: secureCookies ? undefined : false
    }));
    app.use(express.json({ limit: "8kb", strict: true }));
    app.use((request, response, next) => {
        const origin = request.get("origin");
        if (origin) {
            try {
                if (new URL(origin).host !== request.get("host")) {
                    response.status(403).json({ error: "La solicitud no proviene de este sitio." });
                    return;
                }
            } catch (error) {
                response.status(403).json({ error: "El origen de la solicitud no es válido." });
                return;
            }
        }
        next();
    });
    app.use(session({
        name: SESSION_COOKIE_NAME,
        secret: sessionSecret,
        store: new SQLiteSessionStore(database),
        resave: false,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: secureCookies,
            maxAge: SESSION_MAX_AGE
        }
    }));

    app.get("/api/health", (request, response) => {
        response.json({ status: "ok" });
    });

    app.get("/api/content", (request, response) => {
        response.json({ content: getPublicContent() });
    });

    app.get("/api/auth/session", (request, response) => {
        const user = request.session?.userId
            ? readUser.get(request.session.userId)
            : null;
        if (user) {
            response.json({ authenticated: true });
            return;
        }
        response.json({ authenticated: false });
    });

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Demasiados intentos. Espera 15 minutos y vuelve a intentarlo." }
    });

    const registrationLimiter = process.env.NODE_ENV === "production"
        ? rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 10,
            standardHeaders: "draft-8",
            legacyHeaders: false,
            message: { error: "Se hicieron demasiados registros. Inténtalo de nuevo en 15 minutos." }
        })
        : (request, response, next) => next();

    app.post("/api/auth/register", registrationLimiter, async (request, response) => {
        const username = typeof request.body?.username === "string" ? request.body.username.trim() : "";
        const password = typeof request.body?.password === "string" ? request.body.password : "";
        const passwordBytes = Buffer.byteLength(password, "utf8");

        if (!/^[-A-Za-z0-9_.@]{3,64}$/.test(username)) {
            response.status(400).json({ error: "El nombre debe tener entre 3 y 64 caracteres: letras, números, punto, guion, guion bajo o @. No incluyas espacios." });
            return;
        }
        if (passwordBytes < 10 || passwordBytes > 72) {
            response.status(400).json({ error: "La contraseña debe tener entre 10 y 72 bytes." });
            return;
        }
        if (findUserByUsername.get(username)) {
            response.status(409).json({ error: "Ese nombre de usuario ya está registrado." });
            return;
        }

        const userId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const initialProgress = createInitialProgress(createdAt);

        database.exec("BEGIN IMMEDIATE");
        try {
            const result = insertUser.run(userId, username, passwordHash, createdAt);
            if (result.changes !== 1) {
                database.exec("ROLLBACK");
                response.status(409).json({ error: "Ese nombre de usuario ya está registrado." });
                return;
            }
            insertProgress.run(userId, JSON.stringify(initialProgress), createdAt);
            database.exec("COMMIT");
        } catch (error) {
            database.exec("ROLLBACK");
            if (String(error.message).includes("UNIQUE constraint failed: users.username")) {
                response.status(409).json({ error: "Ese nombre de usuario ya está registrado." });
                return;
            }
            throw error;
        }

        await startSession(request);
        request.session.userId = userId;
        response.status(201).json({
            user: { username, createdAt },
            progress: initialProgress,
            content: getPublicContent()
        });
    });

    app.post("/api/auth/login", loginLimiter, async (request, response) => {
        const username = typeof request.body?.username === "string" ? request.body.username.trim() : "";
        const password = typeof request.body?.password === "string" ? request.body.password : "";
        if (!/^[-A-Za-z0-9_.@]{3,64}$/.test(username) || Buffer.byteLength(password, "utf8") > 72) {
            await bcrypt.compare("", dummyPasswordHash);
            response.status(401).json({ error: "Usuario o contraseña incorrectos." });
            return;
        }
        const user = findUserByUsername.get(username);
        const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? dummyPasswordHash);
        if (!user || !passwordMatches) {
            response.status(401).json({ error: "Usuario o contraseña incorrectos." });
            return;
        }

        await startSession(request);
        request.session.userId = user.id;
        response.json({
            user: { username: user.username, createdAt: user.created_at },
            progress: readProgress(user.id),
            content: getPublicContent()
        });
    });

    app.get("/api/auth/me", requireUser, (request, response) => {
        response.json({
            user: { username: request.user.username, createdAt: request.user.created_at },
            progress: readProgress(request.user.id),
            content: getPublicContent()
        });
    });

    app.post("/api/auth/logout", (request, response, next) => {
        if (!request.session) {
            response.clearCookie(SESSION_COOKIE_NAME);
            response.json({ message: "Sesión cerrada." });
            return;
        }
        request.session.destroy(error => {
            if (error) {
                next(error);
                return;
            }
            response.clearCookie(SESSION_COOKIE_NAME, {
                httpOnly: true,
                sameSite: "lax",
                secure: secureCookies
            });
            response.json({ message: "Sesión cerrada." });
        });
    });

    app.post("/api/activity/answer", requireUser, (request, response) => {
        const { type, id, courseId, answer } = request.body ?? {};
        if (typeof answer !== "string" || answer.length > 120) {
            response.status(400).json({ error: "Escribe una respuesta de hasta 120 caracteres." });
            return;
        }
        const progress = readProgress(request.user.id);
        const result = processAnswer(progress, { type, id, courseId, answer });
        if (JSON.stringify(result.progress) !== JSON.stringify(progress)) {
            saveProgress(request.user.id, result.progress);
        }
        response.status(result.status).json(result.body);
    });

    app.post("/api/shop/purchase", requireUser, (request, response) => {
        const itemId = request.body?.itemId;
        const progress = readProgress(request.user.id);
        const result = processPurchase(progress, itemId);
        if (JSON.stringify(result.progress) !== JSON.stringify(progress)) {
            saveProgress(request.user.id, result.progress);
        }
        response.status(result.status).json(result.body);
    });

    app.post("/api/progress/reset", requireUser, (request, response) => {
        const progress = createInitialProgress(request.user.created_at);
        saveProgress(request.user.id, progress);
        response.json({ message: "Tu progreso se reinició.", progress });
    });

    app.use(express.static(publicDirectory, {
        dotfiles: "ignore",
        etag: true,
        index: "index.html",
        maxAge: 0
    }));

    app.use((request, response) => {
        response.status(404).json({ error: "No se encontró la página solicitada." });
    });

    app.use((error, request, response, next) => {
        if (response.headersSent) {
            next(error);
            return;
        }
        if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, "body")) {
            response.status(400).json({ error: "El cuerpo de la solicitud no contiene JSON válido." });
            return;
        }
        console.error("Request failed:", error);
        response.status(500).json({ error: "Ocurrió un error en el servidor. Inténtalo de nuevo." });
    });

    return app;
}

function startServer() {
    const dataDirectory = path.resolve(process.env.CODIGEASS_DATA_DIR || path.join(os.homedir(), ".codigeass"));
    fs.mkdirSync(dataDirectory, { recursive: true });
    const databasePath = path.join(dataDirectory, "codigeass.sqlite");
    const database = initializeDatabase(new DatabaseSync(databasePath));
    const sessionSecret = process.env.SESSION_SECRET;
    if (typeof sessionSecret !== "string" || sessionSecret.length < 32) {
        database.close();
        throw new Error("SESSION_SECRET must contain at least 32 characters. Run npm start to create a local secret.");
    }
    const secureCookies = process.env.NODE_ENV === "production";
    const app = createApp({
        database,
        sessionSecret,
        publicDirectory: path.join(__dirname, "public"),
        secureCookies
    });
    const port = Number.parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "127.0.0.1";
    const server = app.listen(port, host, () => {
        console.log(`CODIGEASS disponible en http://${host}:${port}`);
        console.log(`SQLite guarda los datos localmente en: ${databasePath}`);
    });

    const shutdown = () => {
        server.close(() => {
            database.close();
            process.exit(0);
        });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}

if (require.main === module) {
    try {
        startServer();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { createApp, initializeDatabase };
