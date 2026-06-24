
const STORAGE_KEY = 'examenes_data';

function obtenerExamenes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function renderizarExamenes() {
    const examenes = obtenerExamenes();
    const contenedor = document.querySelector('.preview-main');

    if (examenes.length === 0) {
        contenedor.innerHTML = '<p>No hay exámenes disponibles.</p>';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const codigoBuscado = params.get('codigo');
    const examen = examenes.find(e => e.codigo === codigoBuscado); // EX-001

    if (!examen) {
        contenedor.innerHTML = '<p>Examen no encontrado.</p>';
        return;
    }

    contenedor.innerHTML = `
        <div class="card-preview">
            <span class="card-header-badge"> ${examen.codigo} </span>
            <h1 class="card-title">${examen.titulo}</h1>
            <p class="card-description">Antes de iniciar, registra los datos que quedaran asociados a tus respuestas.</p>
            
            <form id="form-registro" class="card-form">
                <div class="form-group">
                    <label for="identificacion">Numero de identificacion</label>
                    <input type="text" id="identificacion" required>
                </div>
                
                <div class="form-group">
                    <label for="nombre">Nombre completo</label>
                    <input type="text" id="nombre" required>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-iniciar">Iniciar examen</button>
                    <a href="./Examenes.html" class="link-volver">Volver</a>
                </div>
            </form>
        </div>
    `;

    const formregistro = document.getElementById('form-registro');
    if (formregistro) {
        formregistro.addEventListener('submit', (e) => {
            e.preventDefault();
            const identificacion = document.getElementById('identificacion').value;
            const nombre = document.getElementById('nombre').value;

            localStorage.setItem('examen_actual', JSON.stringify({
                identificacion,
                nombre,
                examen,
                tiempo: examen.tiempo,
                preguntas: examen.preguntas,
                fecha_inicio: new Date().toISOString()
            }));

            window.location.href = './RealizarExamen.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', renderizarExamenes);
