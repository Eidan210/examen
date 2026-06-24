class ResolverExamen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        const template = document.getElementById("examen-template");
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.cargarDatosExamen();
    }

    cargarDatosExamen() {
        const examenActualRaw = localStorage.getItem('examen_actual');
        if (!examenActualRaw) {
            alert("No hay ningún examen activo en este momento.");
            window.location.href = "./Examenes.html";
            return;
        }

        const dataExamen = JSON.parse(examenActualRaw);

        this.usuario = {
            identificacion: dataExamen.identificacion || "No registrada",
            nombre: dataExamen.nombre || "Estudiante"
        };

        this.examenActual = dataExamen.examen;
        if (!this.examenActual) {
            alert("El examen cargado es inválido.");
            window.location.href = "./Examenes.html";
            return;
        }

        const codigo = this.examenActual.codigo || "EX-000";
        const titulo = this.examenActual.titulo || "Examen sin título";
        const totalPreguntas = this.examenActual.preguntas ? this.examenActual.preguntas.length : 0;
        const porcentajeAprobacion = this.examenActual.porcentaje || 0;
        const tiempoMinutos = this.examenActual.tiempo || 10;

        this.shadowRoot.getElementById("codigo-examen").textContent = codigo;
        this.shadowRoot.getElementById("titulo-examen").textContent = titulo;
        this.shadowRoot.getElementById("detalles-examen").textContent =
            `${totalPreguntas} preguntas - Aprueba con ${porcentajeAprobacion}%`;

        this.renderizarPreguntas(this.examenActual.preguntas || []);
        this.iniciarTemporizador(tiempoMinutos);
        this.iniciarEventos();
    }

    renderizarPreguntas(arrayPreguntas) {
        const contenedor = this.shadowRoot.getElementById("lista-preguntas");
        contenedor.innerHTML = "";

        arrayPreguntas.forEach((pregunta, indexPregunta) => {
            const divPregunta = document.createElement("div");
            divPregunta.className = "question-block";

            const h3 = document.createElement("h3");
            h3.className = "question-text";
            h3.textContent = `${indexPregunta + 1}. ${pregunta.texto}`;
            divPregunta.appendChild(h3);

            const divOpciones = document.createElement("div");
            divOpciones.className = "options-list";

            const respuestas = pregunta.respuestas || pregunta.opciones || [];

            respuestas.forEach((respuesta, index) => {
                const label = document.createElement("label");
                label.className = "option-label";

                const radio = document.createElement("input");
                radio.type = "radio";
                const preguntaId = pregunta.id !== undefined && pregunta.id !== null ? pregunta.id : indexPregunta;
                radio.name = `pregunta_${preguntaId}`;
                radio.value = respuesta.id !== undefined && respuesta.id !== null ? respuesta.id : index;

                const span = document.createElement("span");
                span.className = "option-text";
                span.textContent = typeof respuesta === 'object' ? respuesta.texto : respuesta;

                label.appendChild(radio);
                label.appendChild(span);
                divOpciones.appendChild(label);
            });

            divPregunta.appendChild(divOpciones);
            contenedor.appendChild(divPregunta);
        });
    }

    iniciarTemporizador(minutosTotales) {
        const examenActualRaw = localStorage.getItem('examen_actual');
        let tiempoRestante = minutosTotales * 60;

        if (examenActualRaw) {
            const dataExamen = JSON.parse(examenActualRaw);
            if (dataExamen.fecha_inicio) {
                const ahora = new Date();
                const inicio = new Date(dataExamen.fecha_inicio);
                const transcurrido = Math.floor((ahora - inicio) / 1000);
                tiempoRestante = (minutosTotales * 60) - transcurrido;
            }
        }

        if (tiempoRestante <= 0) tiempoRestante = 0;

        const display = this.shadowRoot.getElementById("temporizador");

        if (this.intervalo) clearInterval(this.intervalo);

        const actualizarDisplay = () => {
            const minutos = Math.floor(tiempoRestante / 60);
            const segundos = tiempoRestante % 60;
            const minStr = minutos < 10 ? "0" + minutos : String(minutos);
            const segStr = segundos < 10 ? "0" + segundos : String(segundos);
            display.textContent = `${minStr}:${segStr}`;
            display.style.color = tiempoRestante < 60 ? "#ef4444" : "";
        };

        actualizarDisplay();

        if (tiempoRestante <= 0) {
            this.finalizarExamen("Tiempo agotado");
            return;
        }

        this.intervalo = setInterval(() => {
            tiempoRestante--;
            actualizarDisplay();
            if (tiempoRestante <= 0) {
                clearInterval(this.intervalo);
                display.textContent = "00:00";
                this.finalizarExamen("Tiempo agotado");
            }
        }, 1000);
    }

    iniciarEventos() {
        const btnTerminar = this.shadowRoot.getElementById("btn-terminar");
        if (btnTerminar) {
            btnTerminar.addEventListener("click", () => {
                if (confirm("¿Estás seguro de que quieres terminar y enviar el examen?")) {
                    this.finalizarExamen("Enviado por el usuario");
                }
            });
        }
    }

    finalizarExamen(motivo) {
        clearInterval(this.intervalo);

        const inputs = this.shadowRoot.querySelectorAll('input[type="radio"]:checked');
        const respuestasUsuario = {};
        inputs.forEach(input => {
            const idPregunta = input.name.replace('pregunta_', '');
            respuestasUsuario[idPregunta] = parseInt(input.value);
        });

        let correctas = 0;
        const totalPreguntas = this.examenActual.preguntas ? this.examenActual.preguntas.length : 0;
        const porcentajeAprobacion = this.examenActual.porcentaje || 0;

        const breakdownHTML = this.examenActual.preguntas.map((pregunta, indexPregunta) => {
            const preguntaId = pregunta.id !== undefined && pregunta.id !== null ? pregunta.id : indexPregunta;
            const seleccionadaIndex = respuestasUsuario[preguntaId];
            const correctaIndex = pregunta.respuestaCorrecta;
            const respuestas = pregunta.respuestas || pregunta.opciones || [];

            const textoSeleccionada = seleccionadaIndex !== undefined && respuestas[seleccionadaIndex]
                ? (typeof respuestas[seleccionadaIndex] === 'object' ? respuestas[seleccionadaIndex].texto : respuestas[seleccionadaIndex])
                : "Sin responder";

            const textoCorrecta = respuestas[correctaIndex]
                ? (typeof respuestas[correctaIndex] === 'object' ? respuestas[correctaIndex].texto : respuestas[correctaIndex])
                : "No especificada";

            const esCorrecta = seleccionadaIndex !== undefined && seleccionadaIndex === correctaIndex;
            if (esCorrecta) correctas++;

            return `
                <div class="breakdown-item ${esCorrecta ? 'item-correcta' : 'item-incorrecta'}">
                    <div class="breakdown-q-title">
                        <span class="breakdown-icon">${esCorrecta ? '✔' : '✘'}</span>
                        <strong>Pregunta ${indexPregunta + 1}:</strong> ${pregunta.texto}
                    </div>
                    <div class="breakdown-answers">
                        <p>Tu respuesta: <span class="user-answer ${esCorrecta ? 'text-correcta' : 'text-incorrecta'}">${textoSeleccionada}</span></p>
                        ${!esCorrecta ? `<p>Respuesta correcta: <span class="correct-answer">${textoCorrecta}</span></p>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const porcentajeObtenido = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0;
        const aprobado = porcentajeObtenido >= porcentajeAprobacion;

        const nuevoResultado = {
            identificacion: this.usuario.identificacion,
            nombre: this.usuario.nombre,
            codigoExamen: this.examenActual.codigo,
            tituloExamen: this.examenActual.titulo,
            correctas: correctas,
            totalPreguntas: totalPreguntas,
            porcentajeObtenido: porcentajeObtenido,
            porcentajeAprobacion: porcentajeAprobacion,
            aprobado: aprobado,
            motivo: motivo,
            fecha_fin: new Date().toISOString()
        };

        const resultadosGuardados = localStorage.getItem('resultados_examenes');

        let listaResultados = [];

        if (resultadosGuardados !== null) {
            listaResultados = JSON.parse(resultadosGuardados);
        }

        listaResultados.push(nuevoResultado);

        localStorage.setItem('resultados_examenes', JSON.stringify(listaResultados));

        const container = this.shadowRoot.querySelector('.exam-container');
        if (container) {
            container.innerHTML = `
                <div class="result-card">
                    <div class="result-header">
                        <span class="badge-status ${aprobado ? 'status-aprobado' : 'status-reprobado'}">
                            ${aprobado ? 'APROBADO' : 'REPROBADO'}
                        </span>
                        <h1 class="result-title">Resultados del Examen</h1>
                    </div>

                    <div class="result-score-container">
                        <div class="result-score-circle ${aprobado ? 'circle-aprobado' : 'circle-reprobado'}">
                            <span class="score-percent">${porcentajeObtenido}%</span>
                            <span class="score-label">Puntaje</span>
                        </div>
                    </div>

                    <div class="result-info-grid">
                        <div class="info-item"><strong>Estudiante:</strong> <span>${this.usuario.nombre}</span></div>
                        <div class="info-item"><strong>Identificación:</strong> <span>${this.usuario.identificacion}</span></div>
                        <div class="info-item"><strong>Examen:</strong> <span>${this.examenActual.titulo} (${this.examenActual.codigo})</span></div>
                        <div class="info-item"><strong>Respuestas correctas:</strong> <span>${correctas} de ${totalPreguntas}</span></div>
                        <div class="info-item"><strong>Mínimo para aprobar:</strong> <span>${porcentajeAprobacion}%</span></div>
                        <div class="info-item"><strong>Motivo finalización:</strong> <span>${motivo}</span></div>
                    </div>

                    <div class="result-breakdown">
                        <h2>Desglose de Respuestas</h2>
                        <div class="breakdown-list">
                            ${breakdownHTML}
                        </div>
                    </div>

                    <div class="result-footer">
                        <button class="btn-volver-lista" id="btn-volver-lista">Volver a la lista de exámenes</button>
                    </div>
                </div>
            `;

            const btnVolver = this.shadowRoot.getElementById("btn-volver-lista");
            if (btnVolver) {
                btnVolver.addEventListener("click", () => {
                    localStorage.removeItem('examen_actual');
                    window.location.href = "./Examenes.html";
                });
            }
        }
    }
}

customElements.define("resolver-examen", ResolverExamen);