// guardamos las cosas en localstorage para no usar base de datos por ahora
const STORAGE_KEY = 'examenes_data';

// asi es como se ve un examen por dentro (como una plantilla)
const ExamenTemplate = {
    id: null,
    codigo: '',
    titulo: '',
    tiempo: 0,
    porcentaje: 0,
    descripcion: '',
    preguntas: [],
    fechaCreacion: null,
    fechaActualizacion: null
};

const PreguntaTemplate = {
    id: null,
    texto: '',
    respuestas: [],
    respuestaCorrecta: null
};

const RespuestaTemplate = {
    id: null,
    texto: ''
};

// funciones para guardar y sacar cosas del localstorage
class ExamenStorage {
    // sacar todos los examenes que tenemos guardados
    static obtenerTodos() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // meter todos los examenes de golpe
    static guardarTodos(examenes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(examenes));
    }

    // buscar un examen en especifico por su id
    static obtenerPorId(id) {
        const examenes = this.obtenerTodos();
        return examenes.find(e => e.id === id);
    }

    // si no existe lo creamos, si ya existe lo pisamos con los datos nuevos
    static guardarExamen(examen) {
        const examenes = this.obtenerTodos();
        const indice = examenes.findIndex(e => e.id === examen.id);
        
        if (indice === -1) {
            examen.id = Date.now(); // uso el timestamp como id pq es rapido y no se repite
            examen.codigo = this.generarCodigo();
            examen.fechaCreacion = new Date().toISOString();
            examenes.push(examen);
        } else {
            examen.fechaActualizacion = new Date().toISOString();
            examenes[indice] = examen;
        }
        
        this.guardarTodos(examenes);
        return examen;
    }

    // borrar un examen de la lista
    static eliminarExamen(id) {
        const examenes = this.obtenerTodos();
        const filtrados = examenes.filter(e => e.id !== id);
        this.guardarTodos(filtrados);
    }

    // inventar un codigo onda EX-001, EX-002...
    static generarCodigo() {
        const examenes = this.obtenerTodos();
        const numero = examenes.length + 1;
        return `EX-${String(numero).padStart(3, '0')}`;
    }

    // borrar todo de raiz (me sirvio para hacer pruebas jaja)
    static limpiar() {
        localStorage.removeItem(STORAGE_KEY);
    }
}

// aca manejamos todo lo que pasa en la pantalla (clicks, llenar datos, etc)
class GestorExamenes {
    constructor() {
        this.examenActual = null;
        this.contador_preguntas = 1;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.cargarExamenes();
        this.inicializarFormulario();
    }

    attachEventListeners() {
        // cambiar entre la vista de examenes y usuarios
        document.getElementById('nav-usuarios').addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarSeccionUsuarios();
        });
        document.getElementById('nav-examenes').addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarSeccionExamenes();
        });

        // botones de guardar y cancelar
        document.getElementById('btn-guardar-examen').addEventListener('click', (e) => this.guardarExamen(e));
        document.getElementById('btn-cancelar').addEventListener('click', () => this.limpiarFormulario());
        
        // boton de agregar pregunta nueva
        document.getElementById('btn-agregar-pregunta').addEventListener('click', () => this.agregarPregunta());
        
        // click en la tabla de examenes (para editar o borrar)
        document.getElementById('examenes-tabla').addEventListener('click', (e) => this.manejarAccionesTabla(e));

        // ponerle los eventos a la primer pregunta que viene por defecto
        this.attachPreguntaEventListeners(1);
    }

    // dejar el formulario listo para crear un examen nuevo
    inicializarFormulario() {
        // crearle un codigo apenas entramos
        const nuevoCodigo = ExamenStorage.generarCodigo();
        document.getElementById('exam-codigo').value = nuevoCodigo;
    }

    // cuando le dan al boton de guardar examen
    guardarExamen(e) {
        e.preventDefault();

        const examen = {
            ...this.examenActual || { ...ExamenTemplate },
            codigo: document.getElementById('exam-codigo').value,
            titulo: document.getElementById('exam-titulo').value,
            tiempo: parseInt(document.getElementById('exam-tiempo').value),
            porcentaje: parseInt(document.getElementById('exam-porcentaje').value),
            descripcion: document.getElementById('exam-descripcion').value,
            preguntas: this.recolectarPreguntas()
        };

        // un par de chequeos basicos para que no guarden vacio
        if (!examen.titulo.trim()) {
            alert('El título del examen es requerido');
            return;
        }

        if (!examen.tiempo || examen.tiempo <= 0) {
            alert('El tiempo debe ser mayor a 0 minutos');
            return;
        }

        if (examen.preguntas.length === 0) {
            alert('El examen debe tener al menos una pregunta');
            return;
        }

        // me aseguro que no dejen preguntas sin respuesta correcta
        const preguntasValidas = examen.preguntas.every(p => p.respuestaCorrecta !== null);
        if (!preguntasValidas) {
            alert('Cada pregunta debe tener una respuesta correcta marcada');
            return;
        }

        ExamenStorage.guardarExamen(examen);
        this.limpiarFormulario();
        this.cargarExamenes();
        alert('Examen guardado correctamente');
    }

    // armar la lista de preguntas leyendo lo que puso el profe en pantalla
    recolectarPreguntas() {
        const preguntasDiv = document.getElementById('preguntas-list');
        const preguntasElements = preguntasDiv.querySelectorAll('.pregunta-item');
        const preguntas = [];

        preguntasElements.forEach((el, index) => {
            const preguntaId = el.id;
            const textarea = el.querySelector('.pregunta-body textarea');
            const texto = textarea ? textarea.value.trim() : '';
            const respuestasElements = el.querySelectorAll('.respuesta-item');
            const respuestas = [];
            let respuestaCorrecta = null;

            respuestasElements.forEach((respEl, respIndex) => {
                const inputRespuesta = respEl.querySelector('.respuesta-input');
                const radioButton = respEl.querySelector('input[type="radio"]');
                
                if (inputRespuesta) {
                    const textoResp = inputRespuesta.value.trim();
                    const esCorrecta = radioButton ? radioButton.checked : false;
                    
                    if (textoResp) {
                        respuestas.push({
                            id: respIndex,
                            texto: textoResp
                        });
                        
                        if (esCorrecta) {
                            respuestaCorrecta = respIndex;
                        }
                    }
                }
            });

            if (texto && respuestas.length > 0) {
                preguntas.push({
                    id: index,
                    texto: texto,
                    respuestas: respuestas,
                    respuestaCorrecta: respuestaCorrecta
                });
            }
        });

        return preguntas;
    }

    // inyectar html para sumar una pregunta mas al examen
    agregarPregunta() {
        const preguntasList = document.getElementById('preguntas-list');
        this.contador_preguntas = preguntasList.children.length + 1;
        const numPregunta = this.contador_preguntas;

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

        preguntasList.insertAdjacentHTML('beforeend', preguntaHTML);
        this.attachPreguntaEventListeners(numPregunta);
    }

    // ponerle vida a los botones de cada pregunta (eliminar, agregar rta...)
    attachPreguntaEventListeners(numeroPregunta) {
        const preguntaEl = document.getElementById(`pregunta-${numeroPregunta}`);
        
        if (!preguntaEl) return;

        // si le dan a borrar la pregunta entera
        const btnEliminarPregunta = preguntaEl.querySelector('.btn-eliminar-pregunta');
        if (btnEliminarPregunta) {
            btnEliminarPregunta.addEventListener('click', (e) => {
                e.preventDefault();
                if (document.querySelectorAll('.pregunta-item').length === 1) {
                    alert('Debe haber al menos una pregunta');
                    return;
                }
                preguntaEl.remove();
                this.renumerarPreguntas();
            });
        }

        // si quieren sumar una opcion mas de respuesta
        const btnAgregarRespuesta = preguntaEl.querySelector('.btn-agregar-respuesta');
        if (btnAgregarRespuesta) {
            btnAgregarRespuesta.addEventListener('click', (e) => {
                e.preventDefault();
                this.agregarRespuesta(numeroPregunta);
            });
        }

        // borrar una opcion de respuesta especifica
        preguntaEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-eliminar-respuesta')) {
                e.preventDefault();
                const respuestasContainer = document.getElementById(`respuestas-${numeroPregunta}`);
                if (respuestasContainer.children.length === 1) {
                    alert('Debe haber al menos una respuesta');
                    return;
                }
                e.target.closest('.respuesta-item').remove();
            }
        });
    }

    // meter un input nuevo para una opcion de respuesta
    agregarRespuesta(numeroPregunta) {
        const respuestasContainer = document.getElementById(`respuestas-${numeroPregunta}`);
        const numeroRespuesta = respuestasContainer.children.length;
        const letra = String.fromCharCode(65 + numeroRespuesta);

        const respuestaHTML = `
            <div class="respuesta-item">
                <input type="radio" name="correcta-${numeroPregunta}" value="${numeroRespuesta}">
                <input type="text" placeholder="Opción ${letra}" class="respuesta-input">
                <button type="button" class="btn-eliminar-respuesta">✕</button>
            </div>
        `;

        respuestasContainer.insertAdjacentHTML('beforeend', respuestaHTML);
    }

    // acomodar los numeros de las preguntas si borran alguna del medio
    renumerarPreguntas() {
        const preguntasDiv = document.getElementById('preguntas-list');
        const preguntasElements = preguntasDiv.querySelectorAll('.pregunta-item');

        preguntasElements.forEach((el, index) => {
            const numeroNuevo = index + 1;
            el.id = `pregunta-${numeroNuevo}`;
            el.querySelector('label').textContent = `Pregunta ${numeroNuevo}`;
            
            // actualizar los ids y names de los radios para que no se pisen
            const respuestasContainer = el.querySelector('.respuestas-container');
            if (respuestasContainer) {
                respuestasContainer.id = `respuestas-${numeroNuevo}`;
                respuestasContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.name = `correcta-${numeroNuevo}`;
                });
            }

            // volver a ponerle los eventos pq sino los botones no hacen nada
            this.attachPreguntaEventListeners(numeroNuevo);
        });

        this.contador_preguntas = preguntasElements.length;
    }

    // traer los examenes y armar la tabla
    cargarExamenes() {
        const examenes = ExamenStorage.obtenerTodos();
        const tbody = document.getElementById('examenes-tbody');
        tbody.innerHTML = '';

        if (examenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #9ca3af;">No hay exámenes registrados</td></tr>';
            return;
        }

        examenes.forEach(examen => {
            const porcentajeAprobados = Math.floor(Math.random() * 100); // esto lo invento pq no se como sacarlo todavia jaja
            const fila = document.createElement('tr');
            fila.id = `exam-row-${examen.id}`;
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

    // pasar los datos del examen al formulario para poder editarlo
    editarExamen(id) {
        const examen = ExamenStorage.obtenerPorId(id);
        if (!examen) return;

        this.examenActual = examen;

        // rellenar los inputs con los datos
        document.getElementById('exam-codigo').value = examen.codigo;
        document.getElementById('exam-titulo').value = examen.titulo;
        document.getElementById('exam-tiempo').value = examen.tiempo;
        document.getElementById('exam-porcentaje').value = examen.porcentaje;
        document.getElementById('exam-descripcion').value = examen.descripcion;

        // vaciar la lista de preguntas actual para meter las del examen
        const preguntasList = document.getElementById('preguntas-list');
        preguntasList.innerHTML = '';
        this.contador_preguntas = 0;

        // iterar y dibujar cada pregunta
        examen.preguntas.forEach((pregunta, index) => {
            const numeroPregunta = index + 1;
            this.contador_preguntas = numeroPregunta;

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

        // hacer scroll para arriba para que vean el form
        document.getElementById('crear-examen-section').scrollIntoView({ behavior: 'smooth' });
    }

    // borrar un examen y recargar la tablita
    eliminarExamen(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este examen?')) {
            ExamenStorage.eliminarExamen(id);
            this.cargarExamenes();
            alert('Examen eliminado correctamente');
        }
    }

    // saber que boton tocaron en la tabla (editar o eliminar)
    manejarAccionesTabla(e) {
        if (e.target.classList.contains('btn-editar-exam')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            this.editarExamen(id);
        } else if (e.target.classList.contains('btn-eliminar-exam')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            this.eliminarExamen(id);
        }
    }

    // vaciar todo como si recien entraramos
    limpiarFormulario() {
        this.examenActual = null;
        
        const nuevoCodigo = ExamenStorage.generarCodigo();
        document.getElementById('exam-codigo').value = nuevoCodigo;
        document.getElementById('exam-titulo').value = '';
        document.getElementById('exam-tiempo').value = '';
        document.getElementById('exam-porcentaje').value = '';
        document.getElementById('exam-descripcion').value = '';

        // resetear a 1 sola pregunta vacia
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

    mostrarSeccionUsuarios() {
        document.getElementById('nav-usuarios').classList.add('active');
        document.getElementById('nav-examenes').classList.remove('active');

        document.getElementById('usuarios-section').style.display = 'block';
        document.getElementById('crear-examen-section').style.display = 'none';
        document.getElementById('examenes-registrados-section').style.display = 'none';

        const pageHeader = document.getElementById('page-header');
        pageHeader.querySelector('h2').textContent = 'ADMINISTRACIÓN';
        pageHeader.querySelector('h1').textContent = 'Gestión de usuarios';
        pageHeader.querySelector('p').textContent = 'Visualiza los usuarios registrados en la plataforma.';

        this.cargarUsuarios();
    }

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

    cargarUsuarios() {
        const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        const resultados = JSON.parse(localStorage.getItem('resultados_examenes')) || [];
        const tbody = document.getElementById('usuarios-tbody');
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #9ca3af;">No hay usuarios registrados</td></tr>';
            return;
        }

        usuarios.forEach(usuario => {
            const userResults = resultados.filter(r => 
                (r.nombre && r.nombre.toLowerCase() === usuario.nombre.toLowerCase()) || 
                (r.identificacion && r.identificacion.toLowerCase() === usuario.email.toLowerCase())
            );
            
            let examenesHtml = "<span style='color: #9ca3af;'>Ninguno</span>";
            let calificacionHtml = "-";

            if (userResults.length > 0) {
                examenesHtml = userResults.map(r => r.tituloExamen).join('<br><br>');
                calificacionHtml = userResults.map(r => {
                    const color = r.aprobado ? '#10b981' : '#ef4444';
                    const estado = r.aprobado ? 'Aprobado' : 'Reprobado';
                    return `<span style="color: ${color}; font-weight: 500;">${r.porcentajeObtenido}% (${estado})</span>`;
                }).join('<br><br>');
            }

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.cargo || 'Estudiante'}</td>
                <td>${examenesHtml}</td>
                <td>${calificacionHtml}</td>
            `;
            tbody.appendChild(fila);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GestorExamenes();
});