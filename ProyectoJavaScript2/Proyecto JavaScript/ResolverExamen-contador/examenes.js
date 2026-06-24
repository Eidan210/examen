
const STORAGE_KEY = 'examenes_data';

function obtenerExamenes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function renderizarExamenes() {
    const examenes = obtenerExamenes();
    const contenedor = document.querySelector('.Contenedor-Examenes');

    if (examenes.length === 0) {
        contenedor.innerHTML = '<h1 style="text-align: center; margin-top: 20px; font-family: Arial, Helvetica, sans-serif; color: black;">No hay exámenes disponibles.</h1>';
        return;
    }

    contenedor.innerHTML = examenes.map(examen => (`
        <div class="Examenes">
            <div class="Contenedor-Info">
                <h2 class="ID-Examen">ID: ${examen.codigo}</h2>
                <h1>${examen.titulo}</h1>
                <p class="Description">${examen.descripcion}</p>
                <div class="info-examen">
                    <p class="info-text1">Duración: ${examen.tiempo} Minutos</p>
                    <p class="info-text2">Cantidad de Preguntas: ${examen.preguntas.length}</p>
                    <p class="info-text3">Porcentaje de Aprobación: ${examen.porcentaje}%</p>
                </div>
                <div class="Contenedor-Btn">
                    <a class="Btn-Resolver" href="./PreviewExamen.html?codigo=${examen.codigo}">Resolver Examen</a>
                </div>
            </div>
        </div>
        <br>
    `)).join('');
}

document.addEventListener('DOMContentLoaded', renderizarExamenes);
