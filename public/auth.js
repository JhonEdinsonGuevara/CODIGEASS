(() => {
    const message = document.querySelector(".mensaje-acceso");
    const tabs = Array.from(document.querySelectorAll("[data-auth-mode]"));
    const forms = Array.from(document.querySelectorAll("[data-auth-form]"));
    const allowedPages = new Set([
        "index.html",
        "rutas.html",
        "ligas.html",
        "desafio.html",
        "tienda.html",
        "perfil.html"
    ]);

    function getDestination() {
        const requested = new URLSearchParams(window.location.search).get("next");
        return requested && allowedPages.has(requested) ? `/${requested}` : "/index.html";
    }

    function showMessage(text, error = false) {
        message.textContent = text;
        message.classList.toggle("mensaje-error", error);
    }

    function selectMode(mode) {
        tabs.forEach(tab => {
            const active = tab.dataset.authMode === mode;
            tab.classList.toggle("activa", active);
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
        });
        forms.forEach(form => {
            form.hidden = form.dataset.authForm !== mode;
        });
        showMessage("");
        document.querySelector(`[data-auth-form="${mode}"] input`)?.focus();
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => selectMode(tab.dataset.authMode));
    });

    forms.forEach(form => {
        form.addEventListener("submit", async event => {
            event.preventDefault();
            const submitButton = form.querySelector('[type="submit"]');
            const data = new FormData(form);
            const mode = form.dataset.authForm;
            submitButton.disabled = true;
            showMessage(mode === "register" ? "Creando tu cuenta..." : "Iniciando sesión...");

            try {
                const response = await fetch(`/api/auth/${mode}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({
                        username: data.get("username"),
                        password: data.get("password")
                    })
                });
                const result = await response.json();
                if (!response.ok) {
                    showMessage(result.error || "No se pudo completar el acceso.", true);
                    return;
                }
                window.location.assign(getDestination());
            } catch (error) {
                showMessage("No se pudo conectar con CODIGEASS. Comprueba que el servidor esté iniciado.", true);
            } finally {
                submitButton.disabled = false;
            }
        });
    });

    fetch("/api/auth/session", { credentials: "same-origin" })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("No se pudo comprobar la sesión.");
        })
        .then(session => {
            if (session.authenticated) {
                window.location.replace(getDestination());
            }
        })
        .catch(() => {
            showMessage("Inicia el servidor desde VS Code para crear una cuenta o entrar.");
        });
})();
