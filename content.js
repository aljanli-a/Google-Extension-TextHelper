(function () {
    const tooltip = document.createElement("div");
    tooltip.className = "gpt-tooltip";
    tooltip.innerHTML = `
        <div class="gpt-tooltip-content">
            <div id="gptAnswer" class="gpt-tooltip-text">Loading...</div>
            <div class="gpt-tooltip-controls">
                <button id="toggleBtn" class="gpt-tooltip-btn">More</button>
                <button id="refreshBtn" class="gpt-tooltip-btn" title="Refresh">&#x21bb;</button>
            </div>
        </div>
    `;
    document.body.appendChild(tooltip);
    tooltip.style.display = "none";

    let selectedText = "";
    let isLarge = false;
    let currentMode = "normal";

    function highlightSelected(text, selected) {
        const escaped = selected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(escaped, 'gi'), match => `<b>${match}</b>`);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function fetchAnswer(mode) {
        currentMode = mode;
        const answerDiv = document.getElementById("gptAnswer");
        const controls = tooltip.querySelector(".gpt-tooltip-controls");

        // Скрываем кнопки при загрузке
        controls.style.display = "none";
        answerDiv.textContent = "Loading...";

        fetch("http://127.0.0.1:5000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: selectedText, mod: mode })
        })
            .then(res => res.json())
            .then(data => {
                if (mode === currentMode) {
                    answerDiv.innerHTML = highlightSelected(escapeHtml(data.answer), selectedText);
                    answerDiv.style.fontSize = "13px";
                    // Показываем кнопки после загрузки
                    controls.style.display = "flex";
                }
            })
            .catch(err => {
                if (mode === currentMode) {
                    answerDiv.textContent = "Error: " + err.message;
                    console.error(err);
                    // Показываем кнопки даже если ошибка
                    controls.style.display = "flex";
                }
            });
    }


   document.addEventListener("mouseup", (e) => {
        if (tooltip.contains(e.target)) return; // клик внутри тултипа — игнор

        const selection = window.getSelection();
        selectedText = selection.toString().trim();

        // Если нет текста — скрываем тултип
        if (!selectedText || selection.rangeCount === 0) {
            tooltip.style.display = "none";
            return;
        }

        // Проверка, что выделение внутри "нормального" текстового узла
        const range = selection.getRangeAt(0);
        const parentNode = range.commonAncestorContainer.parentNode;

        const ignoreTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT", "VIDEO", "IFRAME", "IMG"];
        if (parentNode && parentNode.tagName && ignoreTags.includes(parentNode.tagName)) {
            tooltip.style.display = "none";
            return;
        }

        // Позиционируем тултип
        isLarge = false;
        currentMode = "normal";
        const rect = range.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.display = "block";

        tooltip.querySelector("#toggleBtn").textContent = "Academic";
        document.getElementById("gptAnswer").style.fontSize = "13px";

        fetchAnswer("normal");
    });



    document.addEventListener("mousedown", (e) => {
        if (!tooltip.contains(e.target)) {
            tooltip.style.display = "none";
        }
    });

    tooltip.querySelector("#toggleBtn").addEventListener("click", () => {
        document.getElementById("gptAnswer").textContent = "Loading...";
        if (!isLarge) {
            fetchAnswer("academic");
            isLarge = true;
            tooltip.querySelector("#toggleBtn").textContent = "Normal";
        } else {
            fetchAnswer("normal");
            isLarge = false;
            tooltip.querySelector("#toggleBtn").textContent = "Academic";
        }
    });

    tooltip.querySelector("#refreshBtn").addEventListener("click", () => {
        document.getElementById("gptAnswer").textContent = "Loading...";
        fetchAnswer(isLarge ? "academic" : "normal");
    });
})();
