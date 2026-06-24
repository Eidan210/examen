// Importamos las funciones necesarias del archivo auth.js para manejar la lógica de usuarios
import { usuariosIniciales, validarUsuario, crearSesion, registrarUsuario } from "./auth.js";

// Ejecutamos esta función para asegurar que el admin por defecto exista en el almacenamiento
usuariosIniciales();

// Definimos un componente web personalizado para encapsular la vista del login
class LoginAcme extends HTMLElement {

    constructor() {
        super();
        // Creamos un Shadow DOM para aislar los estilos y scripts de este componente
        this.attachShadow({ mode: "open" });
    }

    // Método que se dispara cuando el componente es insertado en la página HTML
    connectedCallback() {

        // Traemos la estructura HTML (template) definida en el archivo principal index.html
        const template = document.getElementById("login-template");
        
        // Clonamos el contenido del template y lo insertamos en el Shadow DOM para que se renderice en pantalla
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // A PARTIR DE AQUÍ INICIA LA LÓGICA DE INTERACCIÓN CON LA INTERFAZ

        // Lógica de validación cuando el usuario hace clic en el botón de Iniciar Sesión (Entrar)
        this.shadowRoot.getElementById("entrar").addEventListener("click", () => {

            // Capturamos lo que el usuario escribió
            let email = this.shadowRoot.getElementById("email").value;
            let password = this.shadowRoot.getElementById("password").value;
            let mensaje = this.shadowRoot.querySelector("#vista-login #mensaje"); // Elemento para mostrar mensajes de error/éxito

            // Validamos que no haya campos vacíos
            if (!email || !password) {
                mensaje.textContent = "Completa todos los campos.";
                mensaje.className = "error";
                return;
            }

            // Comprobamos si las credenciales coinciden con algún usuario registrado
            let usuario = validarUsuario(email, password);

            if (usuario) {
                // Si coinciden, guardamos la sesión para usarla en otras partes de la app
                crearSesion(usuario);
                mensaje.textContent = "Bienvenido " + usuario.nombre;
                mensaje.className = "ok";
                // Esperamos un segundo y luego redirigimos al usuario al portal de creación de exámenes
                setTimeout(() => {
                    window.location.href = "../PortalCreaciónExamen/CrearExamen.html";
                }, 1000);
            } else {
                // Si no coinciden, advertimos al usuario
                mensaje.textContent = "Email o contrasena incorrectos.";
                mensaje.className = "error";
            }

        });

        // Funcionalidad para revelar u ocultar la contraseña (icono de ojo en el login)
        this.shadowRoot.getElementById("mostrar").addEventListener("click", () => {

            let input = this.shadowRoot.getElementById("password");

            // Alternamos el tipo de input entre "password" (oculto en asteriscos) y "text" (visible)
            if (input.type === "password") {
                input.type = "text";
            } else {
                input.type = "password";
            }

        });

        // Lógica de validación cuando el usuario hace clic en el botón de Crear cuenta (Registro)
        this.shadowRoot.getElementById("registrar").addEventListener("click", () => {

            // Capturamos los datos del formulario de registro
            let nombre = this.shadowRoot.getElementById("r-nombre").value;
            let email = this.shadowRoot.getElementById("r-email").value;
            let password = this.shadowRoot.getElementById("r-password").value;
            let mensaje = this.shadowRoot.querySelector("#vista-registro #mensaje");

            // Validamos que todos los campos tengan texto
            if (!nombre || !email || !password) {
                mensaje.textContent = "Completa todos los campos.";
                mensaje.className = "error";
                return;
            }

            // Intentamos guardar al usuario. registrarUsuario devolverá false si el correo ya existe.
            let resultado = registrarUsuario(nombre, email, password);

            if (resultado) {
                mensaje.textContent = "Cuenta creada. Ahora inicia sesion.";
                mensaje.className = "ok";
            } else {
                mensaje.textContent = "Ese email ya esta registrado.";
                mensaje.className = "error";
            }

        });

        // Funcionalidad para revelar u ocultar la contraseña (icono de ojo en el formulario de registro)
        this.shadowRoot.getElementById("mostrar-r").addEventListener("click", () => {

            let input = this.shadowRoot.getElementById("r-password");

            if (input.type === "password") {
                input.type = "text";
            } else {
                input.type = "password";
            }

        });

        // Lógica para alternar las vistas: ocultar pantalla de Login y mostrar pantalla de Registro
        this.shadowRoot.getElementById("ir-registro").addEventListener("click", () => {
            this.shadowRoot.getElementById("vista-login").style.display = "none";
            this.shadowRoot.getElementById("vista-registro").style.display = "block";
        });

        // Lógica para alternar las vistas: ocultar pantalla de Registro y volver a pantalla de Login
        this.shadowRoot.getElementById("ir-login").addEventListener("click", () => {
            this.shadowRoot.getElementById("vista-registro").style.display = "none";
            this.shadowRoot.getElementById("vista-login").style.display = "block";
        });

    }

}

// Le indicamos al navegador que reconozca la etiqueta personalizada <login-acme> y la vincule con nuestra clase
customElements.define("login-acme", LoginAcme);