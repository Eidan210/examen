// Función para crear un usuario administrador por defecto si no existe ninguno
export function usuariosIniciales() {

    // Verificamos si ya hay un registro de usuarios en el almacenamiento local
    let usuarios = localStorage.getItem("usuarios");

    // Si no hay ningún usuario registrado (por ejemplo, es la primera vez que se abre la app)
    if (!usuarios) {

        // Creamos un arreglo con un usuario administrador predeterminado
        let usuarios = [
            {
                nombre: "Administrador",
                email: "admin@acme.edu",
                password: "admin123",
                cargo: "Administrativo"
            }
        ];

        // Guardamos este arreglo inicial en localStorage convirtiéndolo a texto JSON
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

    }

}

// Función para verificar las credenciales al momento de iniciar sesión
export function validarUsuario(email, password) {

    // Obtenemos los usuarios registrados o un arreglo vacío si hay un problema
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    // Buscamos un usuario que coincida exactamente con el email y contraseña ingresados
    let usuario = usuarios.find(
        (user) => user.email === email && user.password === password
    );

    // Retorna el objeto del usuario si lo encontró, de lo contrario retorna undefined
    return usuario;

}

// Función para guardar los datos del usuario logueado como la sesión activa
export function crearSesion(usuario) {
    // Almacenamos el objeto del usuario en localStorage bajo la clave "sesion"
    localStorage.setItem("sesion", JSON.stringify(usuario));
}

// Función para registrar un nuevo usuario (estudiante) en el sistema
export function registrarUsuario(nombre, email, password) {

    // Obtenemos la lista actual de usuarios
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    // Comprobamos si ya existe alguien registrado con ese mismo correo electrónico
    let existe = usuarios.find((u) => u.email === email);

    // Si el correo ya existe, rechazamos el registro devolviendo false
    if (existe) {
        return false;
    }

    // Si el correo es nuevo, agregamos el nuevo usuario a la lista con cargo de "Estudiante"
    usuarios.push({ nombre, email, password, cargo: "Estudiante" });

    // Guardamos la lista actualizada en localStorage
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Indicamos que el registro fue exitoso
    return true;

}