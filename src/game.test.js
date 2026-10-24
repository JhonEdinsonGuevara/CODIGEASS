const test = require("node:test");
const assert = require("node:assert/strict");
const {
    createInitialProgress,
    processAnswer,
    processPurchase,
    refreshProgress
} = require("./game");

test("an incorrect answer removes a life without awarding XP", () => {
    const progress = createInitialProgress();
    const result = processAnswer(progress, {
        type: "lesson",
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
        id: "sintaxis",
        answer: "Hola"
    });
    assert.equal(first.body.correct, true);
    assert.equal(first.progress.xp, 50);
    assert.equal(first.progress.dailyActivities, 1);

    const second = processAnswer(first.progress, {
        type: "lesson",
        id: "condicionales",
        answer: "verdadera"
    });
    progress = second.progress;
    assert.equal(second.body.activityXp, 50);
    assert.equal(second.body.missionXp, 25);
    assert.equal(progress.xp, 125);
    assert.equal(progress.dailyRewardClaimed, true);
});

test("lesson order and duplicate submissions are rejected", () => {
    const progress = createInitialProgress();
    const lockedLesson = processAnswer(progress, {
        type: "lesson",
        id: "funciones",
        answer: "def"
    });
    assert.equal(lockedLesson.status, 409);
    assert.equal(lockedLesson.progress.xp, 0);

    const completed = processAnswer(progress, {
        type: "lesson",
        id: "sintaxis",
        answer: "hola"
    });
    const duplicate = processAnswer(completed.progress, {
        type: "lesson",
        id: "sintaxis",
        answer: "hola"
    });
    assert.equal(duplicate.status, 409);
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
        id: "sintaxis",
        answer: "hola"
    }, now + 1000);
    assert.equal(rewarded.body.activityXp, 100);

    const expired = refreshProgress({
        ...purchase.progress,
        hearts: 4,
        heartUpdatedAt: now
    }, now + 31 * 60 * 1000);
    assert.equal(expired.progress.hearts, 5);
});
