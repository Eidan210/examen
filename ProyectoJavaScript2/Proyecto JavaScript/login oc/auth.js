export function usuariosIniciales() {

    let usuarios = localStorage.getItem("usuarios");

    if (!usuarios) {

        let usuarios = [
            {
                nombre: "Administrador",
                email: "admin@acme.edu",
                password: "admin123",
                cargo: "Administrativo"
            }
        ];

        localStorage.setItem("usuarios", JSON.stringify(usuarios));

    }

}

export function validarUsuario(email, password) {

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let usuario = usuarios.find(
        (user) => user.email === email && user.password === password
    );

    return usuario;

}

export function crearSesion(usuario) {
    localStorage.setItem("sesion", JSON.stringify(usuario));
}

export function registrarUsuario(nombre, email, password) {

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let existe = usuarios.find((u) => u.email === email);

    if (existe) {
        return false;
    }

    usuarios.push({ nombre, email, password, cargo: "Estudiante" });

    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    return true;

}