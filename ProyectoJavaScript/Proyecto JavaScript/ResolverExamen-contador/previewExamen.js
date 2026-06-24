// Constante donde se define la clave en la que están guardados todos los exámenes en localStorage
const STORAGE_KEY = 'examenes_data';

// Función para obtener la lista de exámenes de la base de datos local (localStorage)
function obtenerExamenes() {
    const data = localStorage.getItem(STORAGE_KEY);
    // Si hay datos los parseamos de JSON a Array, si no, retornamos un array vacío
    return data ? JSON.parse(data) : [];
}

// Función principal que se encarga de mostrar la vista previa del examen
function renderizarExamenes() {
    const examenes = obtenerExamenes();
    const contenedor = document.querySelector('.preview-main'); // Contenedor en el HTML

    // Si la lista de exámenes está vacía, mostramos un mensaje de error
    if (examenes.length === 0) {
        contenedor.innerHTML = '<p>No hay exámenes disponibles.</p>';
        return;
    }

    // Leemos los parámetros que vienen en la URL (por ejemplo: previewExamen.html?codigo=EX-001)
    const params = new URLSearchParams(window.location.search);
    const codigoBuscado = params.get('codigo'); // Extraemos el valor de "codigo"
    
    // Buscamos dentro de la lista de exámenes aquel que coincida con el código de la URL
    const examen = examenes.find(e => e.codigo === codigoBuscado);

    // Si el usuario manipuló la URL o el código no existe, se muestra un mensaje
    if (!examen) {
        contenedor.innerHTML = '<p>Examen no encontrado.</p>';
        return;
    }

    // Inyectamos el HTML de la tarjeta de presentación al contenedor
    // Esta tarjeta muestra info del examen y pide los datos del estudiante
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

    // Localizamos el formulario recién inyectado
    const formregistro = document.getElementById('form-registro');
    if (formregistro) {
        // Configuramos la acción a realizar cuando el estudiante presione "Iniciar examen"
        formregistro.addEventListener('submit', (e) => {
            e.preventDefault(); // Evitamos que la página se recargue, que es el comportamiento por defecto

            // Extraemos los valores digitados por el usuario
            const identificacion = document.getElementById('identificacion').value;
            const nombre = document.getElementById('nombre').value;

            // Guardamos en localStorage los datos combinados: del estudiante y del examen
            // Esto será leído luego por el archivo RealizarExamen.js
            localStorage.setItem('examen_actual', JSON.stringify({
                identificacion,
                nombre,
                examen, // Guardamos la estructura del examen completa
                tiempo: examen.tiempo,
                preguntas: examen.preguntas,
                fecha_inicio: new Date().toISOString() // Marcamos la hora de inicio oficial
            }));

            // Redirigimos al usuario a la página oficial donde se resuelve el examen
            window.location.href = './RealizarExamen.html';
        });
    }
}

// Aseguramos de que el código solo se ejecute cuando toda la página HTML esté cargada en el navegador
document.addEventListener('DOMContentLoaded', renderizarExamenes);
