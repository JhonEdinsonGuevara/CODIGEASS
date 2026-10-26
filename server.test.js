const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { createApp } = require("./server");

let database;
let server;
let baseUrl;

before(async () => {
    database = new DatabaseSync(":memory:");
    const app = createApp({
        database,
        sessionSecret: "test-session-secret-that-is-long-enough-to-use"
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
    database?.close();
});

async function request(path, { cookie, ...options } = {}) {
    const headers = new Headers(options.headers);
    if (cookie) {
        headers.set("Cookie", cookie);
    }
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    return {
        status: response.status,
        body,
        cookie: response.headers.get("set-cookie")?.split(";")[0] ?? cookie
    };
}

function jsonRequest(body) {
    return {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
}

test("protected API rejects anonymous users and cross-site writes", async () => {
    const anonymous = await request("/api/auth/me");
    assert.equal(anonymous.status, 401);

    const publicContent = await request("/api/content");
    assert.equal(publicContent.status, 200);
    assert.equal(publicContent.body.content.courses.length, 6);
    assert.equal(publicContent.body.content.courses.every(course => course.lessons.length > 0), true);

    const crossSite = await request("/api/auth/register", {
        ...jsonRequest({ username: "intruder", password: "long-enough-password" }),
        headers: {
            "Content-Type": "application/json",
            Origin: "https://attacker.example"
        }
    });
    assert.equal(crossSite.status, 403);
});

test("registration, account isolation, lessons, logout, and login persist in SQLite", async () => {
    const firstRegistration = await request("/api/auth/register", jsonRequest({
        username: "JhonCoder",
        password: "a-strong-test-password"
    }));
    assert.equal(firstRegistration.status, 201);
    assert.ok(firstRegistration.cookie);
    assert.equal(firstRegistration.body.progress.xp, 0);
    assert.equal(firstRegistration.body.user.username, "JhonCoder");
    assert.equal(firstRegistration.body.password, undefined);

    const sessionCookie = firstRegistration.cookie;
    const cookieHeader = `${sessionCookie};`; 
    assert.match(sessionCookie, /^codigeass\.sid=/);
    const userSession = await request("/api/auth/me", { cookie: cookieHeader });
    assert.equal(userSession.status, 200);
    assert.equal(userSession.body.user.username, "JhonCoder");

    const wrongAnswer = await request("/api/activity/answer", {
        ...jsonRequest({ type: "lesson", courseId: "python", id: "sintaxis", answer: "no" }),
        cookie: cookieHeader
    });
    assert.equal(wrongAnswer.body.correct, false);
    assert.equal(wrongAnswer.body.progress.hearts, 4);

    const correctAnswer = await request("/api/activity/answer", {
        ...jsonRequest({ type: "lesson", courseId: "python", id: "sintaxis", answer: "mensaje" }),
        cookie: cookieHeader
    });
    assert.equal(correctAnswer.body.correct, true);
    assert.equal(correctAnswer.body.progress.xp, 50);

    const secondRegistration = await request("/api/auth/register", jsonRequest({
        username: "AnotherUser",
        password: "another-strong-password"
    }));
    assert.equal(secondRegistration.status, 201);
    assert.equal(secondRegistration.body.progress.xp, 0);

    const secondCookie = secondRegistration.cookie;
    const secondProgress = await request("/api/auth/me", { cookie: secondCookie });
    assert.equal(secondProgress.body.progress.hearts, 5);
    assert.equal(secondProgress.body.progress.xp, 0);

    const logout = await request("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cookie: cookieHeader
    });
    assert.equal(logout.status, 200);
    const afterLogout = await request("/api/auth/me", { cookie: cookieHeader });
    assert.equal(afterLogout.status, 401);

    const login = await request("/api/auth/login", jsonRequest({
        username: "jhonCoder",
        password: "a-strong-test-password"
    }));
    assert.equal(login.status, 200);
    const loggedIn = await request("/api/auth/me", { cookie: login.cookie });
    assert.equal(loggedIn.body.progress.xp, 50);
    assert.equal(loggedIn.body.progress.hearts, 4);
});

test("registration validates usernames and passwords", async () => {
    const invalidName = await request("/api/auth/register", jsonRequest({
        username: "x",
        password: "a-strong-test-password"
    }));
    assert.equal(invalidName.status, 400);

    const invalidPassword = await request("/api/auth/register", jsonRequest({
        username: "validUser",
        password: "short"
    }));
    assert.equal(invalidPassword.status, 400);
});

test("registration accepts the requested email-style username", async () => {
    for (const username of [
        "jhonguevara454_gmail.com",
        "jhonguevara454@gmail.com"
    ]) {
        const registration = await request("/api/auth/register", jsonRequest({
            username,
            password: "a-strong-test-password"
        }));
        assert.equal(registration.status, 201);
        assert.equal(registration.body.user.username, username);

        const login = await request("/api/auth/login", jsonRequest({
            username,
            password: "a-strong-test-password"
        }));
        assert.equal(login.status, 200);
        assert.equal(login.body.user.username, username);
    }
});

test("authenticated users can start any course and skip to any lesson", async () => {
    const registration = await request("/api/auth/register", jsonRequest({
        username: "AnyCourseUser",
        password: "a-strong-test-password"
    }));
    const cookie = registration.cookie;

    const content = await request("/api/auth/me", { cookie });
    assert.equal(content.body.content.courses.length, 6);
    assert.equal(content.body.content.courses.every(course => course.lessons.length > 0), true);

    const cssLesson = await request("/api/activity/answer", {
        ...jsonRequest({
            type: "lesson",
            courseId: "css",
            id: "diseno",
            answer: "flex"
        }),
        cookie
    });
    assert.equal(cssLesson.status, 200);
    assert.equal(cssLesson.body.correct, true);
    assert.deepEqual(cssLesson.body.progress.completedLessons, ["css:diseno"]);

    const pythonLaterLesson = await request("/api/activity/answer", {
        ...jsonRequest({
            type: "lesson",
            courseId: "python",
            id: "funciones",
            answer: "12"
        }),
        cookie
    });
    assert.equal(pythonLaterLesson.status, 200);
    assert.equal(pythonLaterLesson.body.correct, true);
    assert.deepEqual(pythonLaterLesson.body.progress.completedLessons, ["css:diseno", "python:funciones"]);
});

test("existing Python progress migrates to the new per-course format", async () => {
    const registration = await request("/api/auth/register", jsonRequest({
        username: "LegacyCourseUser",
        password: "a-strong-test-password"
    }));
    const userId = database.prepare("SELECT id FROM users WHERE username = ?").get("LegacyCourseUser").id;
    const legacyProgress = {
        ...registration.body.progress,
        version: 1,
        completedLessons: ["sintaxis", "funciones"]
    };
    database.prepare("UPDATE progress SET state_json = ? WHERE user_id = ?")
        .run(JSON.stringify(legacyProgress), userId);

    const migrated = await request("/api/auth/me", { cookie: registration.cookie });
    assert.equal(migrated.status, 200);
    assert.equal(migrated.body.progress.version, 2);
    assert.deepEqual(migrated.body.progress.completedLessons, ["python:sintaxis", "python:funciones"]);

    const saved = JSON.parse(database.prepare("SELECT state_json FROM progress WHERE user_id = ?").get(userId).state_json);
    assert.equal(saved.version, 2);
    assert.deepEqual(saved.completedLessons, ["python:sintaxis", "python:funciones"]);
});

test("local development registration does not lock out repeated attempts", async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const registration = await request("/api/auth/register", jsonRequest({
            username: "x",
            password: "a-strong-test-password"
        }));
        assert.equal(registration.status, 400);
        assert.equal(registration.body.error.includes("15 minutos"), false);
    }
});

test("static hosting does not expose server files", async () => {
    const loginPage = await request("/login.html");
    assert.equal(loginPage.status, 200);
    assert.match(loginPage.body, /Crear cuenta/);
    const coursesPage = await request("/cursos.html");
    assert.equal(coursesPage.status, 200);
    assert.match(coursesPage.body, /Cursos de programación/);
    const oldRoutesPage = await request("/rutas.html");
    assert.equal(oldRoutesPage.status, 200);
    assert.match(oldRoutesPage.body, /url=\/cursos\.html/);
    const serverSource = await request("/server.js");
    assert.equal(serverSource.status, 404);
});
