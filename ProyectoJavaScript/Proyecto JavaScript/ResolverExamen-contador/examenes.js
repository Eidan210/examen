// Clave para buscar los exámenes guardados en el almacenamiento local (localStorage)
const STORAGE_KEY = 'examenes_data';

// Función para obtener todos los exámenes registrados
function obtenerExamenes() {
    // Busca en localStorage la cadena de texto con la clave definida arriba
    const data = localStorage.getItem(STORAGE_KEY);
    // Si encuentra datos, los transforma de texto JSON a un arreglo de objetos JavaScript, sino devuelve un arreglo vacío
    return data ? JSON.parse(data) : [];
}

// Función encargada de dibujar las tarjetas de los exámenes en la pantalla
function renderizarExamenes(listaExamenes) {
    const examenes = listaExamenes || obtenerExamenes();
    // Seleccionamos el elemento del HTML donde se inyectarán las tarjetas
    const contenedor = document.querySelector('.Contenedor-Examenes');

    // Si no hay ningún examen, mostramos un mensaje indicando que está vacío
    if (examenes.length === 0) {
        contenedor.innerHTML = '<h1 style="text-align: center; margin-top: 20px; font-family: Arial, Helvetica, sans-serif; color: black;">No hay exámenes disponibles.</h1>';
        return;
    }

    // Iteramos sobre la lista de exámenes para generar la estructura HTML de cada uno
    // map() transforma el array de objetos a un array de strings (código HTML), luego join('') une todo en un solo bloque de texto
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
                    <!-- Botón que lleva a la página previa, pasando el código del examen en la URL para saber cuál cargar -->
                    <a class="Btn-Resolver" href="./PreviewExamen.html?codigo=${examen.codigo}">Resolver Examen</a>
                </div>
            </div>
        </div>
        <br>
    `)).join('');
}

// Aseguramos de que todo el contenido del documento esté cargado antes de ejecutar la función principal
document.addEventListener('DOMContentLoaded', () => {
    renderizarExamenes();

    const inputBuscador = document.getElementById('buscador');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const textoBusqueda = e.target.value.toLowerCase();
            const todosLosExamenes = obtenerExamenes();
            
            // Filtramos el arreglo
            const examenesFiltrados = todosLosExamenes.filter(examen => 
                examen.titulo.toLowerCase().includes(textoBusqueda)
            );
            
            // Vuelves a llamar a la función que pinta la pantalla, pero con la nueva lista
            renderizarExamenes(examenesFiltrados); 
        });
    }
});
