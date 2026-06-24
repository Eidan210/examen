// Definición del Web Component "resolver-examen"
class ResolverExamen extends HTMLElement {
    constructor() {
        super();
        // Inicializamos el Shadow DOM para encapsular los estilos y el HTML de este componente
        this.attachShadow({ mode: "open" });
    }

    // Método de ciclo de vida que se ejecuta cuando el componente se añade al DOM
    connectedCallback() {
        // Obtenemos el template HTML definido en el documento principal
        const template = document.getElementById("examen-template");
        // Clonamos el contenido del template y lo añadimos al Shadow DOM
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        // Iniciamos el proceso de carga de datos del examen
        this.cargarDatosExamen();
    }

    // Método principal para inicializar los datos del examen activo
    cargarDatosExamen() {
        // Obtenemos los datos temporales del examen que el usuario va a realizar desde localStorage
        const examenActualRaw = localStorage.getItem('examen_actual');
        
        // Si no hay datos, redirigimos al usuario a la página de exámenes
        if (!examenActualRaw) {
            alert("No hay ningún examen activo en este momento.");
            window.location.href = "./Examenes.html";
            return;
        }

        // Convertimos el string JSON guardado en localStorage a un objeto JavaScript
        const dataExamen = JSON.parse(examenActualRaw);

        // Guardamos los datos del usuario que va a presentar el examen
        this.usuario = {
            identificacion: dataExamen.identificacion || "No registrada",
            nombre: dataExamen.nombre || "Estudiante"
        };

        // Guardamos la estructura principal del examen
        this.examenActual = dataExamen.examen;
        
        // Verificamos que los datos del examen sean válidos
        if (!this.examenActual) {
            alert("El examen cargado es inválido.");
            window.location.href = "./Examenes.html";
            return;
        }

        // Extraemos las propiedades básicas del examen proporcionando valores por defecto
        const codigo = this.examenActual.codigo || "EX-000";
        const titulo = this.examenActual.titulo || "Examen sin título";
        const totalPreguntas = this.examenActual.preguntas ? this.examenActual.preguntas.length : 0;
        const porcentajeAprobacion = this.examenActual.porcentaje || 0;
        const tiempoMinutos = this.examenActual.tiempo || 10;

        // Actualizamos la interfaz (UI) con los detalles del examen
        this.shadowRoot.getElementById("codigo-examen").textContent = codigo;
        this.shadowRoot.getElementById("titulo-examen").textContent = titulo;
        this.shadowRoot.getElementById("detalles-examen").textContent =
            `${totalPreguntas} preguntas - Aprueba con ${porcentajeAprobacion}%`;

        // Renderizamos las preguntas y opciones en la pantalla
        this.renderizarPreguntas(this.examenActual.preguntas || []);
        // Iniciamos el reloj de cuenta regresiva
        this.iniciarTemporizador(tiempoMinutos);
        // Configuramos los manejadores de eventos (ej. clic en el botón terminar)
        this.iniciarEventos();
    }

    // Método que genera dinámicamente el HTML para mostrar cada pregunta y sus respuestas
    renderizarPreguntas(arrayPreguntas) {
        const contenedor = this.shadowRoot.getElementById("lista-preguntas");
        contenedor.innerHTML = ""; // Limpiamos el contenedor

        // Recorremos cada pregunta del examen
        arrayPreguntas.forEach((pregunta, indexPregunta) => {
            const divPregunta = document.createElement("div");
            divPregunta.className = "question-block";

            // Creamos y agregamos el texto de la pregunta
            const h3 = document.createElement("h3");
            h3.className = "question-text";
            h3.textContent = `${indexPregunta + 1}. ${pregunta.texto}`;
            divPregunta.appendChild(h3);

            const divOpciones = document.createElement("div");
            divOpciones.className = "options-list";

            // Obtenemos las respuestas, manejando diferentes posibles nombres de propiedad (respuestas u opciones)
            const respuestas = pregunta.respuestas || pregunta.opciones || [];

            // Recorremos y generamos las opciones de respuesta (radio buttons)
            respuestas.forEach((respuesta, index) => {
                const label = document.createElement("label");
                label.className = "option-label";

                const radio = document.createElement("input");
                radio.type = "radio";
                
                // Generamos un ID único y seguro para agrupar los radio buttons de la misma pregunta
                const preguntaId = pregunta.id !== undefined && pregunta.id !== null ? pregunta.id : indexPregunta;
                radio.name = `pregunta_${preguntaId}`;
                
                // El valor del radio es el ID de la respuesta o su posición (índice)
                radio.value = respuesta.id !== undefined && respuesta.id !== null ? respuesta.id : index;

                const span = document.createElement("span");
                span.className = "option-text";
                
                // Manejamos si la respuesta es un objeto con la propiedad 'texto' o un simple string
                span.textContent = typeof respuesta === 'object' ? respuesta.texto : respuesta;

                // Agrupamos el radio button y el texto dentro de su etiqueta label
                label.appendChild(radio);
                label.appendChild(span);
                divOpciones.appendChild(label);
            });

            // Ensamblamos la pregunta completa y la añadimos a la lista
            divPregunta.appendChild(divOpciones);
            contenedor.appendChild(divPregunta);
        });
    }

    // Método que maneja la cuenta regresiva del examen
    iniciarTemporizador(minutosTotales) {
        const examenActualRaw = localStorage.getItem('examen_actual');
        let tiempoRestante = minutosTotales * 60; // Convertimos a segundos

        // Ajustamos el tiempo basándonos en cuándo inició realmente (para evitar trucos recargando la página)
        if (examenActualRaw) {
            const dataExamen = JSON.parse(examenActualRaw);
            if (dataExamen.fecha_inicio) {
                const ahora = new Date();
                const inicio = new Date(dataExamen.fecha_inicio);
                const transcurrido = Math.floor((ahora - inicio) / 1000); // Segundos transcurridos
                tiempoRestante = (minutosTotales * 60) - transcurrido;
            }
        }

        // Evitamos tiempos negativos
        if (tiempoRestante <= 0) tiempoRestante = 0;

        const display = this.shadowRoot.getElementById("temporizador");

        // Limpiamos cualquier intervalo previo por seguridad
        if (this.intervalo) clearInterval(this.intervalo);

        // Función interna para actualizar el texto del reloj en pantalla
        const actualizarDisplay = () => {
            const minutos = Math.floor(tiempoRestante / 60);
            const segundos = tiempoRestante % 60;
            const minStr = minutos < 10 ? "0" + minutos : String(minutos);
            const segStr = segundos < 10 ? "0" + segundos : String(segundos);
            display.textContent = `${minStr}:${segStr}`;
            
            // Cambiamos el color a rojo cuando queda menos de 1 minuto (60 segundos)
            display.style.color = tiempoRestante < 60 ? "#ef4444" : "";
        };

        actualizarDisplay();

        // Si ya no queda tiempo al cargar, finalizamos de inmediato
        if (tiempoRestante <= 0) {
            this.finalizarExamen("Tiempo agotado");
            return;
        }

        // Creamos el bucle del temporizador (se ejecuta cada segundo - 1000ms)
        this.intervalo = setInterval(() => {
            tiempoRestante--;
            actualizarDisplay();
            
            // Cuando llega a 0, detenemos el intervalo y terminamos forzosamente el examen
            if (tiempoRestante <= 0) {
                clearInterval(this.intervalo);
                display.textContent = "00:00";
                this.finalizarExamen("Tiempo agotado");
            }
        }, 1000);
    }

    // Configura los eventos de interacción (ej. botón terminar)
    iniciarEventos() {
        const btnTerminar = this.shadowRoot.getElementById("btn-terminar");
        if (btnTerminar) {
            btnTerminar.addEventListener("click", () => {
                // Confirmamos con el usuario antes de procesar el examen
                if (confirm("¿Estás seguro de que quieres terminar y enviar el examen?")) {
                    this.finalizarExamen("Enviado por el usuario");
                }
            });
        }
    }

    // Método encargado de calificar el examen y mostrar la pantalla de resultados
    finalizarExamen(motivo) {
        // Detenemos el reloj permanentemente
        clearInterval(this.intervalo);

        // Obtenemos solo los radio buttons que el usuario seleccionó
        const inputs = this.shadowRoot.querySelectorAll('input[type="radio"]:checked');
        const respuestasUsuario = {};
        
        // Guardamos las respuestas del usuario asociando el ID de la pregunta con la opción elegida
        inputs.forEach(input => {
            const idPregunta = input.name.replace('pregunta_', ''); // Limpiamos el nombre
            respuestasUsuario[idPregunta] = parseInt(input.value);
        });

        let correctas = 0;
        const totalPreguntas = this.examenActual.preguntas ? this.examenActual.preguntas.length : 0;
        const porcentajeAprobacion = this.examenActual.porcentaje || 0;

        // Construimos el HTML del desglose respuesta por respuesta y al mismo tiempo calculamos las correctas
        const breakdownHTML = this.examenActual.preguntas.map((pregunta, indexPregunta) => {
            const preguntaId = pregunta.id !== undefined && pregunta.id !== null ? pregunta.id : indexPregunta;
            const seleccionadaIndex = respuestasUsuario[preguntaId]; // Lo que eligió el usuario
            const correctaIndex = pregunta.respuestaCorrecta; // La respuesta real correcta
            const respuestas = pregunta.respuestas || pregunta.opciones || [];

            // Obtenemos el texto de la respuesta elegida (o indicamos que no respondió)
            const textoSeleccionada = seleccionadaIndex !== undefined && respuestas[seleccionadaIndex]
                ? (typeof respuestas[seleccionadaIndex] === 'object' ? respuestas[seleccionadaIndex].texto : respuestas[seleccionadaIndex])
                : "Sin responder";

            // Obtenemos el texto de la respuesta correcta
            const textoCorrecta = respuestas[correctaIndex]
                ? (typeof respuestas[correctaIndex] === 'object' ? respuestas[correctaIndex].texto : respuestas[correctaIndex])
                : "No especificada";

            // Evaluamos si el usuario acertó
            const esCorrecta = seleccionadaIndex !== undefined && seleccionadaIndex === correctaIndex;
            if (esCorrecta) correctas++; // Sumamos al puntaje

            // Devolvemos un bloque HTML para mostrar en el resumen final
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
        }).join(''); // Unimos todos los bloques en un solo texto HTML

        // Calculamos nota final y estado de aprobación
        const porcentajeObtenido = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0;
        const aprobado = porcentajeObtenido >= porcentajeAprobacion;

        // Preparamos el objeto con el registro de calificación para guardarlo
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

        // Recuperamos el historial de resultados de otros exámenes guardados
        const resultadosGuardados = localStorage.getItem('resultados_examenes');
        let listaResultados = [];
        if (resultadosGuardados !== null) {
            listaResultados = JSON.parse(resultadosGuardados);
        }

        // Añadimos nuestro nuevo resultado a la lista y la guardamos
        listaResultados.push(nuevoResultado);
        localStorage.setItem('resultados_examenes', JSON.stringify(listaResultados));

        // Actualizamos la vista eliminando las preguntas y mostrando la tarjeta de resultados final
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

            // Asignamos el evento al nuevo botón que se acaba de crear para volver al menú
            const btnVolver = this.shadowRoot.getElementById("btn-volver-lista");
            if (btnVolver) {
                btnVolver.addEventListener("click", () => {
                    // Limpiamos los datos del examen actual para que no quede activo
                    localStorage.removeItem('examen_actual');
                    window.location.href = "./Examenes.html"; // Regresamos a la pantalla de lista
                });
            }
        }
    }
}

// Registramos el web component personalizado para que el navegador lo entienda
customElements.define("resolver-examen", ResolverExamen);