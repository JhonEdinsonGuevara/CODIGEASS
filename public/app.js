(() => {
    const messageElement = document.querySelector(".mensaje-app");
    let state;
    let user;
    let content;
    let activeDialog;
    let messageTimer;

    function showMessage(message, isError = false) {
        if (!messageElement) {
            return;
        }
        window.clearTimeout(messageTimer);
        messageElement.textContent = message;
        messageElement.classList.toggle("mensaje-error", isError);
        messageElement.classList.add("mensaje-visible");
        messageTimer = window.setTimeout(() => {
            messageElement.classList.remove("mensaje-visible");
        }, 4500);
    }

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            },
            credentials: "same-origin"
        });
        const result = await response.json();
        if (response.status === 401) {
            const page = window.location.pathname.split("/").pop();
            window.location.assign(`/login.html?next=${encodeURIComponent(page)}`);
            throw new Error(result.error || "Inicia sesión para continuar.");
        }
        if (!response.ok) {
            const error = new Error(result.error || "No se pudo completar la solicitud.");
            error.status = response.status;
            error.data = result;
            throw error;
        }
        return result;
    }

    function applyProgress(progress) {
        state = progress;
        render();
    }

    function render() {
        if (!state || !user) {
            return;
        }
        document.querySelectorAll('[data-stat="xp"]').forEach(element => {
            element.textContent = state.xp.toLocaleString("es-CO");
        });
        document.querySelectorAll('[data-stat="hearts"]').forEach(element => {
            element.textContent = `${state.hearts}/5`;
        });
        document.querySelectorAll('[data-stat="streak"]').forEach(element => {
            element.textContent = String(state.streak);
        });
        document.querySelectorAll('[data-stat="lessons"]').forEach(element => {
            element.textContent = String(state.completedLessons.length);
        });
        document.querySelectorAll('[data-stat="daily"]').forEach(element => {
            element.textContent = String(Math.min(state.dailyActivities, 2));
        });
        document.querySelectorAll('[data-progress="daily"]').forEach(element => {
            element.style.width = `${Math.min(state.dailyActivities / 2, 1) * 100}%`;
        });
        document.querySelectorAll('[data-member-since]').forEach(element => {
            element.textContent = `📅 Miembro desde ${new Intl.DateTimeFormat("es-CO", {
                month: "long",
                year: "numeric"
            }).format(new Date(user.createdAt))}`;
        });
        document.querySelectorAll(".nombre-usuario").forEach(element => {
            element.textContent = state.inventory.cyberTitle
                ? `${user.username} (Cyber Dev)`
                : `${user.username} (Codigeass)`;
        });
        document.querySelectorAll("[data-league-name]").forEach(element => {
            element.textContent = `TÚ (${user.username})`;
        });
        document.querySelectorAll("[data-profile-avatar], [data-league-avatar]").forEach(element => {
            element.textContent = state.inventory.ninja ? "🥷" : "⚡";
        });

        renderLessons();
        renderChallenges();
        renderShop();
        renderAchievements();
    }

    function renderLessons() {
        const firstIncomplete = content.lessons.find(lesson => !state.completedLessons.includes(lesson.id));
        document.querySelectorAll("[data-lesson-id]").forEach(button => {
            const completed = state.completedLessons.includes(button.dataset.lessonId);
            const locked = !completed && firstIncomplete?.id !== button.dataset.lessonId;
            button.disabled = completed || locked;
            button.classList.toggle("completado", completed);
            button.classList.toggle("bloqueado", locked);
            button.textContent = completed ? "✓" : locked ? "🔒" : "▶";
            button.title = completed
                ? "Lección completada"
                : locked
                    ? "Completa la lección anterior para desbloquearla"
                    : "Abrir lección";
        });
    }

    function renderChallenges() {
        document.querySelectorAll("[data-start-challenge]").forEach(button => {
            const completed = state.completedChallenges.includes(button.dataset.startChallenge);
            button.disabled = completed;
            button.textContent = completed ? "Completado ✓" : "Comenzar reto";
            button.closest(".tarjeta-desafio")?.classList.toggle("reto-completado", completed);
        });
    }

    function renderShop() {
        const owned = {
            hearts: state.hearts === 5,
            "double-xp": state.inventory.doubleXpUntil > Date.now(),
            ninja: state.inventory.ninja,
            "cyber-title": state.inventory.cyberTitle
        };
        document.querySelectorAll("[data-buy]").forEach(button => {
            const item = button.dataset.buy;
            const price = Number(button.dataset.price);
            const alreadyOwned = owned[item] === true;
            const insufficientXp = state.xp < price;
            button.disabled = alreadyOwned || insufficientXp;
            if (item === "hearts" && alreadyOwned) {
                button.textContent = "Vidas completas";
            } else if (item === "double-xp" && alreadyOwned) {
                button.textContent = "Multiplicador activo";
            } else if (alreadyOwned) {
                button.textContent = "Ya comprado";
            } else if (insufficientXp) {
                button.textContent = `Faltan ${(price - state.xp).toLocaleString("es-CO")} XP`;
            } else {
                button.textContent = `Comprar por ${price.toLocaleString("es-CO")} XP`;
            }
        });
    }

    function renderAchievements() {
        const unlocked = {
            "first-lesson": state.completedLessons.length > 0,
            streak: state.streak >= 7,
            python: state.completedLessons.length === content.lessons.length
        };
        Object.entries(unlocked).forEach(([id, achieved]) => {
            const card = document.querySelector(`[data-achievement="${id}"]`);
            card?.classList.toggle("desbloqueado", achieved);
            card?.classList.toggle("bloqueado", !achieved);
        });
    }

    function openExercise(activity, type) {
        if (state.hearts === 0) {
            showMessage("No tienes vidas disponibles. Espera a recuperar una o consigue más en la tienda.", true);
            return;
        }
        closeExercise();
        const dialog = document.createElement("dialog");
        dialog.className = "dialogo-ejercicio";
        dialog.setAttribute("aria-labelledby", "titulo-ejercicio");
        dialog.innerHTML = `
            <form class="formulario-ejercicio">
                <button class="cerrar-dialogo" type="button" aria-label="Cerrar">×</button>
                <p class="subtitulo-dialogo"></p>
                <h2 id="titulo-ejercicio"></h2>
                <p class="explicacion-ejercicio"></p>
                <label class="pregunta-ejercicio" for="respuesta-ejercicio"></label>
                <input id="respuesta-ejercicio" name="respuesta" type="text" maxlength="120" autocomplete="off" required>
                <p class="resultado-ejercicio" role="status" aria-live="polite"></p>
                <div class="acciones-dialogo">
                    <span class="premio-dialogo"></span>
                    <button class="btn-iniciar" type="submit">Comprobar respuesta</button>
                </div>
            </form>`;
        dialog.querySelector(".subtitulo-dialogo").textContent = type === "lesson"
            ? "LECCIÓN DE PYTHON"
            : "DESAFÍO DE PROGRAMACIÓN";
        dialog.querySelector("#titulo-ejercicio").textContent = activity.title;
        dialog.querySelector(".explicacion-ejercicio").textContent = activity.explanation;
        dialog.querySelector(".pregunta-ejercicio").textContent = activity.question;
        dialog.querySelector(".premio-dialogo").textContent = `Recompensa: +${activity.reward} XP`;
        document.body.append(dialog);
        activeDialog = dialog;
        dialog.showModal();
        const form = dialog.querySelector("form");
        const input = dialog.querySelector("#respuesta-ejercicio");
        const submitButton = form.querySelector('[type="submit"]');
        input.focus();

        dialog.querySelector(".cerrar-dialogo").addEventListener("click", closeExercise);
        dialog.addEventListener("click", event => {
            if (event.target === dialog) {
                closeExercise();
            }
        });
        dialog.addEventListener("close", () => {
            dialog.remove();
            if (activeDialog === dialog) {
                activeDialog = null;
            }
        }, { once: true });
        form.addEventListener("submit", async event => {
            event.preventDefault();
            submitButton.disabled = true;
            try {
                const result = await requestJson("/api/activity/answer", {
                    method: "POST",
                    body: JSON.stringify({
                        type,
                        id: activity.id,
                        answer: input.value
                    })
                });
                applyProgress(result.progress);
                if (result.correct) {
                    closeExercise();
                    showMessage(result.message);
                    return;
                }
                dialog.querySelector(".resultado-ejercicio").textContent = result.message;
                if (state.hearts === 0) {
                    closeExercise();
                    showMessage(result.message, true);
                }
            } catch (error) {
                if (error.data?.progress) {
                    applyProgress(error.data.progress);
                }
                showMessage(error.message, true);
            } finally {
                if (dialog.open) {
                    submitButton.disabled = false;
                }
            }
        });
    }

    function closeExercise() {
        if (activeDialog?.open) {
            activeDialog.close();
        }
    }

    async function logout() {
        try {
            await requestJson("/api/auth/logout", { method: "POST", body: "{}" });
            window.location.assign("/login.html");
        } catch (error) {
            showMessage(error.message, true);
        }
    }

    document.addEventListener("click", async event => {
        const lessonButton = event.target.closest("[data-lesson-id]");
        if (lessonButton && !lessonButton.disabled) {
            const lesson = content.lessons.find(item => item.id === lessonButton.dataset.lessonId);
            if (lesson) {
                openExercise(lesson, "lesson");
            }
            return;
        }
        const challengeButton = event.target.closest("[data-start-challenge]");
        if (challengeButton && !challengeButton.disabled) {
            const challenge = content.challenges.find(item => item.id === challengeButton.dataset.startChallenge);
            if (challenge) {
                openExercise(challenge, "challenge");
            }
            return;
        }
        const purchaseButton = event.target.closest("[data-buy]");
        if (purchaseButton && !purchaseButton.disabled) {
            purchaseButton.disabled = true;
            try {
                const result = await requestJson("/api/shop/purchase", {
                    method: "POST",
                    body: JSON.stringify({ itemId: purchaseButton.dataset.buy })
                });
                applyProgress(result.progress);
                showMessage(result.message);
            } catch (error) {
                showMessage(error.message, true);
            }
            return;
        }
        if (event.target.closest("[data-reset-progress]")) {
            if (!window.confirm("Esto borrará tus XP, vidas, compras y lecciones de esta cuenta. ¿Quieres continuar?")) {
                return;
            }
            try {
                const result = await requestJson("/api/progress/reset", {
                    method: "POST",
                    body: "{}"
                });
                applyProgress(result.progress);
                showMessage(result.message);
            } catch (error) {
                showMessage(error.message, true);
            }
            return;
        }
        if (event.target.closest("[data-logout]")) {
            await logout();
        }
    });

    async function initialize() {
        try {
            const result = await requestJson("/api/auth/me");
            user = result.user;
            state = result.progress;
            content = result.content;
            render();
            window.setInterval(async () => {
                try {
                    const updated = await requestJson("/api/auth/me");
                    applyProgress(updated.progress);
                } catch (error) {
                    showMessage(error.message, true);
                }
            }, 60 * 1000);
        } catch (error) {
            if (window.location.pathname !== "/login.html") {
                showMessage("No se pudo conectar con el servidor. Revisa que CODIGEASS esté iniciado en VS Code.", true);
            }
        }
    }

    initialize();
})();
