// Almacenamos la información localmente en el navegador (localStorage) para que persista sin necesidad de una base de datos real
const STORAGE_KEY = 'examenes_data';

// --- PLANTILLAS DE DATOS ---
// Estructura base que define qué información lleva un examen completo
const ExamenTemplate = {
    id: null,
    codigo: '', // Ej: EX-001
    titulo: '',
    tiempo: 0, // Tiempo límite en minutos
    porcentaje: 0, // Porcentaje mínimo para aprobar
    descripcion: '',
    preguntas: [], // Arreglo que guardará objetos de tipo PreguntaTemplate
    fechaCreacion: null,
    fechaActualizacion: null
};

// Estructura base para cada pregunta dentro de un examen
const PreguntaTemplate = {
    id: null,
    texto: '', // Enunciado de la pregunta
    respuestas: [], // Opciones disponibles
    respuestaCorrecta: null // Índice de la respuesta que es la correcta
};

// Estructura base para cada opción de respuesta
const RespuestaTemplate = {
    id: null,
    texto: ''
};

// --- CLASE DE ALMACENAMIENTO ---
// Esta clase maneja toda la comunicación con localStorage (guardar, leer, borrar datos)
class ExamenStorage {
    
    // Obtiene el arreglo completo de exámenes guardados. Si no hay nada, devuelve un arreglo vacío.
    static obtenerTodos() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Sobrescribe el almacenamiento con el arreglo completo de exámenes proporcionado
    static guardarTodos(examenes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(examenes));
    }

    // Busca y retorna un examen específico basándose en su ID único
    static obtenerPorId(id) {
        const examenes = this.obtenerTodos();
        return examenes.find(e => e.id === id);
    }

    // Función principal para crear un nuevo examen o actualizar uno existente
    static guardarExamen(examen) {
        const examenes = this.obtenerTodos();
        const indice = examenes.findIndex(e => e.id === examen.id);
        
        if (indice === -1) {
            // Si el índice es -1, significa que no existe, por lo que es un examen NUEVO
            examen.id = Date.now(); // Usamos la marca de tiempo (timestamp) actual como ID único
            examen.codigo = this.generarCodigo(); // Generamos un código legible tipo "EX-001"
            examen.fechaCreacion = new Date().toISOString();
            examenes.push(examen); // Lo añadimos a la lista
        } else {
            // Si el examen ya existe, es una ACTUALIZACIÓN (edición)
            examen.fechaActualizacion = new Date().toISOString();
            examenes[indice] = examen; // Reemplazamos la versión antigua con la nueva
        }
        
        // Guardamos los cambios en el navegador
        this.guardarTodos(examenes);
        return examen;
    }

    // Busca un examen por ID y lo remueve del arreglo, guardando el arreglo resultante
    static eliminarExamen(id) {
        const examenes = this.obtenerTodos();
        const filtrados = examenes.filter(e => e.id !== id);
        this.guardarTodos(filtrados);
    }

    // Crea un código secuencial para el examen basándose en la cantidad de exámenes existentes (ej: EX-001, EX-002)
    static generarCodigo() {
        const examenes = this.obtenerTodos();
        const numero = examenes.length + 1;
        // padStart asegura que siempre tenga 3 dígitos (001, 015, etc.)
        return `EX-${String(numero).padStart(3, '0')}`;
    }

    // Borra toda la base de datos de exámenes (útil para reiniciar/depurar)
    static limpiar() {
        localStorage.removeItem(STORAGE_KEY);
    }
}

// --- CLASE GESTORA DE LA INTERFAZ ---
// Esta clase controla la página de administración: interacciones de usuario, botones, creación dinámica de HTML
class GestorExamenes {
    constructor() {
        this.examenActual = null; // Almacena el examen que se está editando en este momento (si lo hay)
        this.contador_preguntas = 1; // Lleva la cuenta de cuántas preguntas hay en el formulario
        this.init(); // Arranca las configuraciones iniciales
    }

    // Método inicializador que ejecuta los preparativos básicos de la pantalla
    init() {
        this.attachEventListeners(); // Vincula los clics de botones a sus funciones
        this.cargarExamenes(); // Dibuja la tabla con los exámenes ya existentes
        this.inicializarFormulario(); // Prepara el formulario de "crear examen"
    }

    // Asigna los "escuchadores" de eventos a los botones estáticos del HTML
    attachEventListeners() {
        // Navegación principal: Pestaña "Usuarios"
        document.getElementById('nav-usuarios').addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarSeccionUsuarios();
        });
        
        // Navegación principal: Pestaña "Exámenes"
        document.getElementById('nav-examenes').addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarSeccionExamenes();
        });

        // Controles principales del formulario de creación/edición
        document.getElementById('btn-guardar-examen').addEventListener('click', (e) => this.guardarExamen(e));
        document.getElementById('btn-cancelar').addEventListener('click', () => this.limpiarFormulario());
        
        // Controles para agregar partes dinámicas al examen
        document.getElementById('btn-agregar-pregunta').addEventListener('click', () => this.agregarPregunta());
        
        // Utilizamos "delegación de eventos" en la tabla: escuchamos los clics en el contenedor
        // y luego verificamos si el clic fue en un botón de editar/eliminar
        document.getElementById('examenes-tabla').addEventListener('click', (e) => this.manejarAccionesTabla(e));

        // Inicializamos los eventos de la primera pregunta vacía que viene por defecto en el HTML
        this.attachPreguntaEventListeners(1);
    }

    // Pre-carga datos en el formulario nuevo, como sugerir el próximo código (EX-...)
    inicializarFormulario() {
        const nuevoCodigo = ExamenStorage.generarCodigo();
        document.getElementById('exam-codigo').value = nuevoCodigo;
    }

    // Función que procesa el formulario cuando el usuario presiona "Guardar Examen"
    guardarExamen(e) {
        e.preventDefault();

        // Armamos el objeto con toda la información digitada en los inputs
        const examen = {
            ...this.examenActual || { ...ExamenTemplate }, // Mantiene datos como el ID si es una edición
            codigo: document.getElementById('exam-codigo').value,
            titulo: document.getElementById('exam-titulo').value,
            tiempo: parseInt(document.getElementById('exam-tiempo').value),
            porcentaje: parseInt(document.getElementById('exam-porcentaje').value),
            descripcion: document.getElementById('exam-descripcion').value,
            preguntas: this.recolectarPreguntas() // Llama a otra función para procesar todas las preguntas y respuestas
        };

        // --- VALIDACIONES DE NEGOCIO ---
        // Verificamos que los datos más importantes no estén en blanco
        if (!examen.titulo.trim()) {
            alert('El título del examen es requerido');
            return; // Detiene la ejecución si falla la validación
        }

        if (!examen.tiempo || examen.tiempo <= 0) {
            alert('El tiempo debe ser mayor a 0 minutos');
            return;
        }

        if (examen.preguntas.length === 0) {
            alert('El examen debe tener al menos una pregunta');
            return;
        }

        // Verifica estrictamente que el profesor haya marcado una (y solo una) opción correcta por cada pregunta
        const preguntasValidas = examen.preguntas.every(p => p.respuestaCorrecta !== null);
        if (!preguntasValidas) {
            alert('Cada pregunta debe tener una respuesta correcta marcada');
            return;
        }

        // Si todas las validaciones pasan, se procede a guardar
        ExamenStorage.guardarExamen(examen);
        this.limpiarFormulario(); // Resetea el formulario para uno nuevo
        this.cargarExamenes(); // Actualiza la tabla para mostrar el examen recién guardado
        alert('Examen guardado correctamente');
    }

    // Recorre todos los elementos HTML de preguntas para extraer sus textos y opciones y armar arreglos
    recolectarPreguntas() {
        const preguntasDiv = document.getElementById('preguntas-list');
        const preguntasElements = preguntasDiv.querySelectorAll('.pregunta-item');
        const preguntas = [];

        // Por cada bloque de pregunta...
        preguntasElements.forEach((el, index) => {
            const textarea = el.querySelector('.pregunta-body textarea');
            const texto = textarea ? textarea.value.trim() : ''; // El texto de la pregunta
            
            const respuestasElements = el.querySelectorAll('.respuesta-item');
            const respuestas = [];
            let respuestaCorrecta = null;

            // Por cada bloque de opción de respuesta dentro de esa pregunta...
            respuestasElements.forEach((respEl, respIndex) => {
                const inputRespuesta = respEl.querySelector('.respuesta-input');
                const radioButton = respEl.querySelector('input[type="radio"]'); // El radio button indica si es la correcta
                
                if (inputRespuesta) {
                    const textoResp = inputRespuesta.value.trim();
                    const esCorrecta = radioButton ? radioButton.checked : false;
                    
                    if (textoResp) {
                        // Si la opción tiene texto, la agregamos a las posibles respuestas
                        respuestas.push({
                            id: respIndex,
                            texto: textoResp
                        });
                        
                        // Si el profesor marcó esta como correcta, guardamos su índice
                        if (esCorrecta) {
                            respuestaCorrecta = respIndex;
                        }
                    }
                }
            });

            // Solo guardamos la pregunta si tiene texto y al menos una opción de respuesta
            if (texto && respuestas.length > 0) {
                preguntas.push({
                    id: index, // ID secuencial
                    texto: texto,
                    respuestas: respuestas,
                    respuestaCorrecta: respuestaCorrecta
                });
            }
        });

        return preguntas; // Devolvemos el arreglo estructurado
    }

    // Añade el código HTML de un nuevo bloque de pregunta al formulario
    agregarPregunta() {
        const preguntasList = document.getElementById('preguntas-list');
        this.contador_preguntas = preguntasList.children.length + 1;
        const numPregunta = this.contador_preguntas;

        // Plantilla HTML de una pregunta (incluye botón eliminar, text area para el texto y una opción 'A' por defecto)
        const preguntaHTML = `
            <div class="pregunta-item" id="pregunta-${numPregunta}">
                <div class="pregunta-header">
                    <label>Pregunta ${numPregunta}</label>
                    <button type="button" class="btn-eliminar btn-eliminar-pregunta">Eliminar</button>
                </div>
                <div class="pregunta-body">
                    <textarea id="pregunta-texto-${numPregunta}" placeholder="Escribe la pregunta..."></textarea>
                </div>
                <div class="respuestas-container" id="respuestas-${numPregunta}">
                    <div class="respuesta-item">
                        <input type="radio" name="correcta-${numPregunta}" value="0">
                        <input type="text" placeholder="Opción A" class="respuesta-input">
                        <button type="button" class="btn-eliminar-respuesta">✕</button>
                    </div>
                </div>
                <button type="button" class="btn-agregar-respuesta">+ Agregar respuesta</button>
            </div>
        `;

        // insertAdjacentHTML inserta el bloque sin romper los eventos de los bloques anteriores
        preguntasList.insertAdjacentHTML('beforeend', preguntaHTML);
        // Le asignamos sus eventos correspondientes (clics de botones internos) al bloque recién creado
        this.attachPreguntaEventListeners(numPregunta);
    }

    // Le da funcionalidad a los botones de Eliminar Pregunta, Agregar Respuesta y Eliminar Respuesta dentro de un bloque
    attachPreguntaEventListeners(numeroPregunta) {
        const preguntaEl = document.getElementById(`pregunta-${numeroPregunta}`);
        
        if (!preguntaEl) return;

        // Botón "Eliminar" (Pregunta completa)
        const btnEliminarPregunta = preguntaEl.querySelector('.btn-eliminar-pregunta');
        if (btnEliminarPregunta) {
            btnEliminarPregunta.addEventListener('click', (e) => {
                e.preventDefault();
                // Validamos que no borren la única pregunta restante
                if (document.querySelectorAll('.pregunta-item').length === 1) {
                    alert('Debe haber al menos una pregunta');
                    return;
                }
                preguntaEl.remove(); // Borra el bloque HTML
                this.renumerarPreguntas(); // Arregla los números ("Pregunta 2" pasa a ser "Pregunta 1")
            });
        }

        // Botón "+ Agregar respuesta"
        const btnAgregarRespuesta = preguntaEl.querySelector('.btn-agregar-respuesta');
        if (btnAgregarRespuesta) {
            btnAgregarRespuesta.addEventListener('click', (e) => {
                e.preventDefault();
                this.agregarRespuesta(numeroPregunta); // Invoca la función para inyectar una opción
            });
        }

        // Delegación de eventos para los botones de la 'X' que borran opciones individuales
        preguntaEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-eliminar-respuesta')) {
                e.preventDefault();
                const respuestasContainer = document.getElementById(`respuestas-${numeroPregunta}`);
                // Previene que se queden sin opciones de respuesta
                if (respuestasContainer.children.length === 1) {
                    alert('Debe haber al menos una respuesta');
                    return;
                }
                // Encuentra el bloque '.respuesta-item' más cercano (el padre) y lo elimina
                e.target.closest('.respuesta-item').remove();
            }
        });
    }

    // Añade el código HTML de una nueva opción de respuesta (ej: "Opción B")
    agregarRespuesta(numeroPregunta) {
        const respuestasContainer = document.getElementById(`respuestas-${numeroPregunta}`);
        const numeroRespuesta = respuestasContainer.children.length; // Posición de la nueva (0, 1, 2...)
        const letra = String.fromCharCode(65 + numeroRespuesta); // Convierte a letras: 65='A', 66='B', etc.

        const respuestaHTML = `
            <div class="respuesta-item">
                <input type="radio" name="correcta-${numeroPregunta}" value="${numeroRespuesta}">
                <input type="text" placeholder="Opción ${letra}" class="respuesta-input">
                <button type="button" class="btn-eliminar-respuesta">✕</button>
            </div>
        `;

        respuestasContainer.insertAdjacentHTML('beforeend', respuestaHTML);
    }

    // Corrige la numeración de los encabezados (Pregunta 1, Pregunta 2) y los 'names' de los radios
    // Esto es crítico porque si se borra la pregunta 2, la 3 debe convertirse en la 2 para mantener consistencia.
    renumerarPreguntas() {
        const preguntasDiv = document.getElementById('preguntas-list');
        const preguntasElements = preguntasDiv.querySelectorAll('.pregunta-item');

        preguntasElements.forEach((el, index) => {
            const numeroNuevo = index + 1; // El índice empieza en 0, la vista en 1
            el.id = `pregunta-${numeroNuevo}`;
            el.querySelector('label').textContent = `Pregunta ${numeroNuevo}`; // Cambia el texto visual
            
            // Reasigna los IDs a las cajas de opciones y corrige los name de los radio buttons
            // (Si no se corrige el name, los radios de distintas preguntas se cruzarían)
            const respuestasContainer = el.querySelector('.respuestas-container');
            if (respuestasContainer) {
                respuestasContainer.id = `respuestas-${numeroNuevo}`;
                respuestasContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.name = `correcta-${numeroNuevo}`;
                });
            }

            // Vuelve a asociar eventos al nuevo bloque (los eventos anteriores se perdieron o desincronizaron al renombrar IDs)
            this.attachPreguntaEventListeners(numeroNuevo);
        });

        this.contador_preguntas = preguntasElements.length;
    }

    // Dibuja la tabla inferior que lista todos los exámenes guardados
    cargarExamenes() {
        const examenes = ExamenStorage.obtenerTodos();
        const tbody = document.getElementById('examenes-tbody');
        tbody.innerHTML = ''; // Limpiamos la tabla antigua

        // Si no hay exámenes, mostramos un aviso en la tabla
        if (examenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #9ca3af;">No hay exámenes registrados</td></tr>';
            return;
        }

        // Si hay, generamos una fila (<tr>) por cada examen
        examenes.forEach(examen => {
            // Un valor falso aleatorio, ya que esta app no incluye un cálculo real de promedios de todos los alumnos en este momento
            const porcentajeAprobados = Math.floor(Math.random() * 100); 
            
            const fila = document.createElement('tr');
            fila.id = `exam-row-${examen.id}`;
            // Se le asigna el data-id a los botones para saber qué examen editar o borrar al hacer clic
            fila.innerHTML = `
                <td>${examen.codigo}</td>
                <td>${examen.titulo}</td>
                <td>${examen.tiempo} min</td>
                <td>${porcentajeAprobados}%</td>
                <td>${examen.preguntas.length}</td>
                <td>
                    <button class="btn-editar btn-editar-exam" data-id="${examen.id}">Editar</button>
                    <button class="btn-eliminar-tabla btn-eliminar-exam" data-id="${examen.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Toma los datos de un examen ya existente y rellena el formulario de la parte superior para editarlo
    editarExamen(id) {
        const examen = ExamenStorage.obtenerPorId(id);
        if (!examen) return;

        this.examenActual = examen; // Marcamos que estamos en modo "edición"

        // Pasamos los valores base a los campos de texto del HTML
        document.getElementById('exam-codigo').value = examen.codigo;
        document.getElementById('exam-titulo').value = examen.titulo;
        document.getElementById('exam-tiempo').value = examen.tiempo;
        document.getElementById('exam-porcentaje').value = examen.porcentaje;
        document.getElementById('exam-descripcion').value = examen.descripcion;

        // Limpiamos el contenedor de preguntas visual
        const preguntasList = document.getElementById('preguntas-list');
        preguntasList.innerHTML = '';
        this.contador_preguntas = 0;

        // Dibujamos pregunta por pregunta simulando lo que guardó el profesor
        examen.preguntas.forEach((pregunta, index) => {
            const numeroPregunta = index + 1;
            this.contador_preguntas = numeroPregunta;

            // Se dibuja la pregunta con sus respuestas, marcando el radio button correcto si coincide
            const preguntaHTML = `
                <div class="pregunta-item" id="pregunta-${numeroPregunta}">
                    <div class="pregunta-header">
                        <label>Pregunta ${numeroPregunta}</label>
                        <button type="button" class="btn-eliminar btn-eliminar-pregunta">Eliminar</button>
                    </div>
                    <div class="pregunta-body">
                        <textarea id="pregunta-texto-${numeroPregunta}">${pregunta.texto}</textarea>
                    </div>
                    <div class="respuestas-container" id="respuestas-${numeroPregunta}">
                        ${pregunta.respuestas.map((respuesta, respIndex) => `
                            <div class="respuesta-item">
                                <input type="radio" name="correcta-${numeroPregunta}" value="${respIndex}" ${pregunta.respuestaCorrecta === respIndex ? 'checked' : ''}>
                                <input type="text" value="${respuesta.texto}" class="respuesta-input">
                                <button type="button" class="btn-eliminar-respuesta">✕</button>
                            </div>
                        `).join('')}
                    </div>
                    <button type="button" class="btn-agregar-respuesta">+ Agregar respuesta</button>
                </div>
            `;
            preguntasList.insertAdjacentHTML('beforeend', preguntaHTML);
            this.attachPreguntaEventListeners(numeroPregunta);
        });

        // Hacemos scroll suavemente hacia el inicio del formulario para que el profesor empiece a editar
        document.getElementById('crear-examen-section').scrollIntoView({ behavior: 'smooth' });
    }

    // Función que elimina un examen, verificando la intención del usuario primero
    eliminarExamen(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este examen?')) {
            ExamenStorage.eliminarExamen(id);
            this.cargarExamenes(); // Refresca la tabla
            alert('Examen eliminado correctamente');
        }
    }

    // Evento disparado desde la tabla inferior; identifica el botón y actúa en consecuencia
    manejarAccionesTabla(e) {
        if (e.target.classList.contains('btn-editar-exam')) {
            // Extrae el data-id guardado en el botón
            const id = parseInt(e.target.getAttribute('data-id'));
            this.editarExamen(id);
        } else if (e.target.classList.contains('btn-eliminar-exam')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            this.eliminarExamen(id);
        }
    }

    // Resetea el formulario dejándolo totalmente vacío y preparándolo para la "Creación" de uno nuevo
    limpiarFormulario() {
        this.examenActual = null; // Quita la bandera de "edición"
        
        const nuevoCodigo = ExamenStorage.generarCodigo();
        document.getElementById('exam-codigo').value = nuevoCodigo;
        document.getElementById('exam-titulo').value = '';
        document.getElementById('exam-tiempo').value = '';
        document.getElementById('exam-porcentaje').value = '';
        document.getElementById('exam-descripcion').value = '';

        // Restaura el bloque a tener solo la Pregunta 1 inicial vacía
        const preguntasList = document.getElementById('preguntas-list');
        preguntasList.innerHTML = `
            <div class="pregunta-item" id="pregunta-1">
                <div class="pregunta-header">
                    <label>Pregunta 1</label>
                    <button type="button" id="btn-eliminar-pregunta-1" class="btn-eliminar">Eliminar</button>
                </div>
                <div class="pregunta-body">
                    <textarea id="pregunta-texto-1" placeholder="Escribe la pregunta..."></textarea>
                </div>
                <div class="respuestas-container" id="respuestas-1">
                    <div class="respuesta-item">
                        <input type="radio" name="correcta-1" value="0">
                        <input type="text" placeholder="Opción A" class="respuesta-input">
                        <button type="button" class="btn-eliminar-respuesta">✕</button>
                    </div>
                </div>
                <button type="button" class="btn-agregar-respuesta">+ Agregar respuesta</button>
            </div>
        `;

        this.contador_preguntas = 1;
        this.attachPreguntaEventListeners(1);
    }

    // --- NAVEGACIÓN Y VISTAS ALTERNAS ---
    // Cambia la vista activa para mostrar la lista de usuarios, ocultando la gestión de exámenes
    mostrarSeccionUsuarios() {
        document.getElementById('nav-usuarios').classList.add('active');
        document.getElementById('nav-examenes').classList.remove('active');

        // Alternar CSS displays
        document.getElementById('usuarios-section').style.display = 'block';
        document.getElementById('crear-examen-section').style.display = 'none';
        document.getElementById('examenes-registrados-section').style.display = 'none';

        // Actualizar los textos de cabecera en el HTML
        const pageHeader = document.getElementById('page-header');
        pageHeader.querySelector('h2').textContent = 'ADMINISTRACIÓN';
        pageHeader.querySelector('h1').textContent = 'Gestión de usuarios';
        pageHeader.querySelector('p').textContent = 'Visualiza los usuarios registrados en la plataforma.';

        // Invoca el renderizado de la tabla de usuarios
        this.cargarUsuarios();
    }

    // Cambia la vista activa devolviendo a la gestión de exámenes (vista original)
    mostrarSeccionExamenes() {
        document.getElementById('nav-examenes').classList.add('active');
        document.getElementById('nav-usuarios').classList.remove('active');

        document.getElementById('usuarios-section').style.display = 'none';
        document.getElementById('crear-examen-section').style.display = 'block';
        document.getElementById('examenes-registrados-section').style.display = 'block';

        const pageHeader = document.getElementById('page-header');
        pageHeader.querySelector('h2').textContent = 'BANCO DE PREGUNTAS';
        pageHeader.querySelector('h1').textContent = 'Gestión de exámenes';
        pageHeader.querySelector('p').textContent = 'Configure exámenes, preguntas y respuestas. Cada pregunta admite una única respuesta correcta.';
    }

    // Carga los usuarios desde localStorage, así como sus calificaciones e inyecta la tabla
    cargarUsuarios() {
        // Trae de localStorage la información de "auth" y "RealizarExamen"
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const resultados = JSON.parse(localStorage.getItem('resultados_examenes')) || [];
        const tbody = document.getElementById('usuarios-tbody');
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9ca3af;">No hay usuarios registrados</td></tr>';
            return;
        }

        usuarios.forEach(usuario => {
            // Filtra los exámenes presentados por este usuario coincidiendo el nombre o email
            const userResults = resultados.filter(r => 
                (r.nombre && r.nombre.toLowerCase() === usuario.nombre.toLowerCase()) || 
                (r.identificacion && r.identificacion.toLowerCase() === usuario.email.toLowerCase())
            );
            
            let examenesHtml = "<span style='color: #9ca3af;'>Ninguno</span>";
            let calificacionHtml = "-";

            // Si ha presentado exámenes, formatea la salida para mostrar los títulos y las notas de cada uno
            if (userResults.length > 0) {
                examenesHtml = userResults.map(r => r.tituloExamen).join('<br><br>');
                calificacionHtml = userResults.map(r => {
                    const color = r.aprobado ? '#10b981' : '#ef4444';
                    const estado = r.aprobado ? 'Aprobado' : 'Reprobado';
                    return `<span style="color: ${color}; font-weight: 500;">${r.porcentajeObtenido}% (${estado})</span>`;
                }).join('<br><br>');
            }

            // Construye la fila inyectando los datos
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${usuario.nombre}</td>
                <td>
                    <input type="text" class="email-input" data-old-email="${usuario.email}" value="${usuario.email}" style="padding: 5px 8px; border-radius: 5px; border: 1px solid #cbd5e1; font-family: var(--font-body, sans-serif); color: #1e293b; background-color: #f8fafc; outline: none; transition: border-color 0.3s ease; width: 180px;">
                </td>
                <td>
                    <select class="role-select" data-email="${usuario.email}" style="padding: 5px; border-radius: 5px; border: 1px solid #cbd5e1; font-family: var(--font-body, sans-serif); color: #1e293b; background-color: #f8fafc; cursor: pointer; outline: none; transition: background-color 0.3s ease;">
                        <option value="Estudiante" ${(!usuario.cargo || usuario.cargo === 'Estudiante') ? 'selected' : ''}>Estudiante</option>
                        <option value="Administrativo" ${usuario.cargo === 'Administrativo' ? 'selected' : ''}>Administrativo</option>
                        <option value="Profesor" ${usuario.cargo === 'Profesor' ? 'selected' : ''}>Profesor</option>
                    </select>
                </td>
                <td>${examenesHtml}</td>
                <td>${calificacionHtml}</td>
            `;
            tbody.appendChild(fila);
        });

        // Agregamos eventos a los nuevos select para actualizar el cargo en vivo
        const roleSelects = tbody.querySelectorAll('.role-select');
        roleSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const userEmail = e.target.getAttribute('data-email');
                const nuevoCargo = e.target.value;
                
                // Buscamos al usuario en el arreglo original
                const indice = usuarios.findIndex(u => u.email === userEmail);
                if (indice !== -1) {
                    // Actualizamos y guardamos
                    usuarios[indice].cargo = nuevoCargo;
                    localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    
                    // Feedback visual sutil (parpadeo verde claro) para indicar que se guardó
                    e.target.style.backgroundColor = '#d1fae5';
                    setTimeout(() => {
                        e.target.style.backgroundColor = '#f8fafc';
                    }, 600);
                }
            });
        });

        // Agregamos eventos a los nuevos inputs para actualizar el cargo en vivo
        const emailInputs = tbody.querySelectorAll('.email-input');
        emailInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const oldEmail = e.target.getAttribute('data-old-email');
                const newEmail = e.target.value;
                
                // Buscamos al usuario en el arreglo original
                const indice = usuarios.findIndex(u => u.email === oldEmail);
                if (indice !== -1) {
                    // Actualizamos el email
                    usuarios[indice].email = newEmail;
                    localStorage.setItem('usuarios', JSON.stringify(usuarios));
                    
                    // Actualizamos el atributo en la tabla (fila) para que los selects sigan apuntando al usuario correcto
                    e.target.setAttribute('data-old-email', newEmail);
                    const selectActual = tbody.querySelector(`.role-select[data-email="${oldEmail}"]`);
                    if (selectActual) {
                        selectActual.setAttribute('data-email', newEmail);
                    }

                    // También actualizamos el email en los resultados de exámenes si existen
                    const resultados = JSON.parse(localStorage.getItem('resultados_examenes')) || [];
                    resultados.forEach(resultado => {
                        if (resultado.email === oldEmail) {
                            resultado.email = newEmail;
                        }
                    });
                    localStorage.setItem('resultados_examenes', JSON.stringify(resultados));
                    
                    // Feedback visual sutil (parpadeo verde claro) para indicar que se guardó
                    e.target.style.backgroundColor = '#d1fae5';
                    setTimeout(() => {
                        e.target.style.backgroundColor = '#f8fafc';
                    }, 600);
                }
            });
        });
    }
}

// Punto de entrada de la aplicación: Espera a que el navegador termine de leer el HTML, luego lanza el gestor
document.addEventListener('DOMContentLoaded', () => {
    new GestorExamenes();
});