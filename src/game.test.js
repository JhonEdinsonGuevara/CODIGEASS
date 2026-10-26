const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createInitialProgress,
    migrateProgress,
    processAnswer,
    processPurchase,
    refreshProgress
} = require("./game");

test("an incorrect answer removes a life without awarding XP", () => {
    const progress = createInitialProgress();
    const result = processAnswer(progress, {
        type: "lesson",
        courseId: "python",
        id: "sintaxis",
        answer: "incorrecta"
    });

    assert.equal(result.body.correct, false);
    assert.equal(result.progress.hearts, 4);
    assert.equal(result.progress.xp, 0);
});

test("a correct answer grants XP and progresses the daily mission", () => {
    let progress = createInitialProgress();
    const first = processAnswer(progress, {
        type: "lesson",
        courseId: "python",
        id: "sintaxis",
        answer: "mensaje"
    });
    assert.equal(first.body.correct, true);
    assert.equal(first.progress.xp, 50);
    assert.equal(first.progress.dailyActivities, 1);

    const second = processAnswer(first.progress, {
        type: "lesson",
        courseId: "python",
        id: "condicionales",
        answer: ">="
    });
    progress = second.progress;
    assert.equal(second.body.activityXp, 50);
    assert.equal(second.body.missionXp, 25);
    assert.equal(progress.xp, 125);
    assert.equal(progress.dailyRewardClaimed, true);
});

test("any lesson can be completed without prerequisites, but duplicate submissions are rejected", () => {
    const progress = createInitialProgress();
    const laterLesson = processAnswer(progress, {
        type: "lesson",
        courseId: "python",
        id: "funciones",
        answer: "12"
    });
    assert.equal(laterLesson.status, 200);
    assert.equal(laterLesson.body.correct, true);
    assert.deepEqual(laterLesson.progress.completedLessons, ["python:funciones"]);

    const completed = processAnswer(progress, {
        type: "lesson",
        courseId: "python",
        id: "sintaxis",
        answer: "mensaje"
    });
    const duplicate = processAnswer(completed.progress, {
        type: "lesson",
        courseId: "python",
        id: "sintaxis",
        answer: "mensaje"
    });
    assert.equal(duplicate.status, 409);
});

test("Python beginner lessons use practical examples with validated answers", () => {
    const cases = [
        { id: "sintaxis", answer: "mensaje" },
        { id: "condicionales", answer: ">=" },
        { id: "bucles", answer: "6" },
        { id: "funciones", answer: "12" },
        { id: "clases", answer: "class" }
    ];

    for (const lesson of cases) {
        const result = processAnswer(createInitialProgress(), {
            type: "lesson",
            courseId: "python",
            ...lesson
        });
        assert.equal(result.body.correct, true, `Python lesson ${lesson.id} should accept its practical answer`);
    }

    const incorrectCondition = processAnswer(createInitialProgress(), {
        type: "lesson",
        courseId: "python",
        id: "condicionales",
        answer: ">"
    });
    assert.equal(incorrectCondition.body.correct, false);
});

test("each programming course can be started independently and keeps its own progress", () => {
    const initial = createInitialProgress();
    const htmlLesson = processAnswer(initial, {
        type: "lesson",
        courseId: "html",
        id: "estructura",
        answer: "main"
    });
    assert.equal(htmlLesson.status, 200);
    assert.deepEqual(htmlLesson.progress.completedLessons, ["html:estructura"]);

    const pythonLesson = processAnswer(htmlLesson.progress, {
        type: "lesson",
        courseId: "python",
        id: "funciones",
        answer: "12"
    });
    assert.equal(pythonLesson.status, 200);
    assert.deepEqual(pythonLesson.progress.completedLessons, ["html:estructura", "python:funciones"]);

    const unknownCourse = processAnswer(initial, {
        type: "lesson",
        courseId: "unknown",
        id: "estructura",
        answer: "p"
    });
    assert.equal(unknownCourse.status, 400);
});

test("HTML lessons check semantic structure, link destinations, and image descriptions", () => {
    const cases = [
        { id: "estructura", answer: "main" },
        { id: "enlaces", answer: "href" },
        { id: "imagenes", answer: "alt" }
    ];

    for (const lesson of cases) {
        const result = processAnswer(createInitialProgress(), {
            type: "lesson",
            courseId: "html",
            ...lesson
        });
        assert.equal(result.body.correct, true, `HTML lesson ${lesson.id} should accept ${lesson.answer}`);
    }

    const incorrectStructure = processAnswer(createInitialProgress(), {
        type: "lesson",
        courseId: "html",
        id: "estructura",
        answer: "p"
    });
    assert.equal(incorrectStructure.body.correct, false);
});

test("existing version-one Python lesson progress is migrated", () => {
    const legacy = {
        ...createInitialProgress(),
        version: 1,
        completedLessons: ["sintaxis", "funciones"]
    };
    const { progress, changed } = migrateProgress(legacy);
    assert.equal(changed, true);
    assert.equal(progress.version, 2);
    assert.deepEqual(progress.completedLessons, ["python:sintaxis", "python:funciones"]);
});

test("the store rejects unaffordable purchases and completes heart refills", () => {
    const progress = createInitialProgress();
    const unaffordable = processPurchase(progress, "ninja");
    assert.equal(unaffordable.status, 400);

    const injured = { ...progress, xp: 300, hearts: 4 };
    const refill = processPurchase(injured, "hearts");
    assert.equal(refill.status, 200);
    assert.equal(refill.progress.xp, 0);
    assert.equal(refill.progress.hearts, 5);
});

test("a purchased XP multiplier doubles rewards only during its active hour", () => {
    const now = Date.now();
    const progress = {
        ...createInitialProgress(),
        xp: 400,
        inventory: { doubleXpUntil: null, ninja: false, cyberTitle: false }
    };
    const purchase = processPurchase(progress, "double-xp", now);
    assert.equal(purchase.progress.xp, 0);

    const rewarded = processAnswer(purchase.progress, {
        type: "lesson",
        courseId: "python",
        id: "sintaxis",
        answer: "mensaje"
    }, now + 1000);
    assert.equal(rewarded.body.activityXp, 100);

    const expired = refreshProgress({
        ...purchase.progress,
        hearts: 4,
        heartUpdatedAt: now
    }, now + 31 * 60 * 1000);
    assert.equal(expired.progress.hearts, 5);
});
