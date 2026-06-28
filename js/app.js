// =========================================================================
// CONFIGURACIÓN INICIAL Y CAPTURA DE ELEMENTOS (Conexión HTML con JavaScript)
// =========================================================================

// pt: Define la URL base de la API (endpoint) para las peticiones HTTP de Axios.
// pn: Guardamos la dirección de la base de datos para saber a dónde pedirle la información.
const API_URL = "http://localhost:3000";

// pt: Inicializa referencias del DOM asignando los contenedores principales.
// pn: Buscamos los lugares vacíos de la página web donde después vamos a meter las tarjetas con los datos.
const contenedorDepartamentos = document.getElementById("contenedor-departamentos");
const contenedorEmpleados = document.getElementById("contenedor-empleados");

// pt: Mapea los elementos de entrada (inputs) del formulario de empleados.
// pn: Capturamos los casilleros de texto donde el usuario escribe el nombre, cargo o fecha del empleado.
const formEmpleado = document.getElementById("form-empleado");
const inputEmpleadoId = document.getElementById("empleado-id"); // ID oculto: sirve para saber si estamos editando uno viejo o creando uno nuevo
const inputEmpleadoNombre = document.getElementById("empleado-nombre");
const inputEmpleadoCargo = document.getElementById("empleado-cargo");
const inputEmpleadoFecha = document.getElementById("empleado-fecha");
const selectEmpleadoDepartamento = document.getElementById("empleado-departamento");
const filtroDepartamento = document.getElementById("filtro-departamento"); // El buscador desplegable para filtrar
const btnCancelarEmpleado = document.getElementById("btn-cancelar-empleado");

// pt: Captura los nodos del DOM vinculados al módulo de asistencias.
// pn: Guardamos el formulario y los botones de la parte donde se toma asistencia.
const formAsistencia = document.getElementById("form-asistencia");
const selectAsistenciaEmpleado = document.getElementById("asistencia-empleado");
const filtroEmpleadoAsistencia = document.getElementById("filtro-empleado-asistencia");
const contenedorAsistencias = document.getElementById("contenedor-asistencias");

// pt: Asigna variables para la manipulación del formulario de departamentos.
// pn: Guardamos los casilleros donde se anota el nombre de un departamento y su jefe responsable.
const formDepartamento = document.getElementById("form-departamento");
const inputDepartamentoId = document.getElementById("departamento-id"); 
const inputDepartamentoNombre = document.getElementById("departamento-nombre");
const inputDepartamentoResponsable = document.getElementById("departamento-responsable");
const btnCancelarDepartamento = document.getElementById("btn-cancelar-departamento");


// =========================================================================
// CONTROLADORES DE EVENTOS / EVENT LISTENERS (Los "escuchadores" de botones)
// =========================================================================

// pt: Registra un manejador para el evento DOMContentLoaded, disparando la inicialización del sistema.
// pn: Le decimos al navegador: "Apenas termines de cargar el diseño de la página, activa la función iniciarApp".
document.addEventListener("DOMContentLoaded", iniciarApp);

// pt: Función asíncrona que suscribe los controladores a los eventos 'submit', 'click' y 'change'.
// pn: Una función que conecta cada botón con su acción matemática para que hagan algo cuando los presionas.
async function iniciarApp() {
    // Escuchadores de Departamentos: Activan acciones al hacer clic en Guardar (submit) o Cancelar (click)
    formDepartamento.addEventListener("submit", guardarDepartamento);
    btnCancelarDepartamento.addEventListener("click", cancelarEdicionDepartamento);

    // Escuchadores de Empleados: El evento 'change' detecta si el usuario cambió la opción del menú desplegable
    formEmpleado.addEventListener("submit", guardarEmpleado);
    btnCancelarEmpleado.addEventListener("click", cancelarEdicionEmpleado);
    filtroDepartamento.addEventListener("change", cargarEmpleados); 

    // Escuchadores de Asistencias
    formAsistencia.addEventListener("submit", registrarAsistencia);
    filtroEmpleadoAsistencia.addEventListener("change", cargarAsistencias);

    // pt: Invoca la carga inicial de datos persistidos de forma asíncrona mediante promesas.
    // pn: Una vez que los botones están listos, traemos la información guardada desde el servidor.
    await cargarDatos();
}

// pt: Agrupa las llamadas asíncronas para poblar los componentes de la interfaz de usuario.
// pn: Una lista de tareas que manda a llamar a todas las funciones de carga juntas.
async function cargarDatos() {
    await cargarDepartamentos();
    await cargarSelectDepartamentos();
    await cargarEmpleados();
    await cargarSelectEmpleados();
    await cargarAsistencias();
}


// =========================================================================
// SECCIÓN DE ASISTENCIAS (LÓGICA Y DATOS)
// =========================================================================

// pt: Realiza una petición GET mediante Axios para rellenar los elementos select de asistencias.
// pn: Trae la lista de empleados del servidor y los mete adentro del menú desplegable para poder elegirlos.
async function cargarSelectEmpleados() {
    try {
        const response = await axios.get(`${API_URL}/empleados`);
        const empleados = response.data;

        // Limpiamos el menú visual agregando la opción por defecto
        selectAsistenciaEmpleado.innerHTML = `
            <option value="">Seleccione empleado</option>
        `;

        filtroEmpleadoAsistencia.innerHTML = `
            <option value="">Todos los empleados</option>
        `;

        // pt: Itera sobre la colección de datos para inyectar código HTML dinámico de tipo option.
        // pn: Recorremos los empleados uno por uno y creamos su opción correspondiente en el menú con su ID y nombre.
        empleados.forEach(function(empleado) {
            selectAsistenciaEmpleado.innerHTML += `
                <option value="${empleado.id}">${empleado.nombre}</option>
            `;

            filtroEmpleadoAsistencia.innerHTML += `
                <option value="${empleado.id}">${empleado.nombre}</option>
            `;
        });
    } catch (error) {
        // pt: Captura excepciones y las registra en la consola del desarrollador.
        // pn: Si hay un fallo de red o el servidor está caído, muestra el aviso de error en la consola negra.
        console.error("Error al cargar empleados en selects:", error);
    }
}

// pt: Maneja el envío de datos de asistencia mediante el método POST de HTTP.
// pn: Toma los datos del formulario y crea una nueva falta o presencia en la base de datos.
async function registrarAsistencia(event) {
    // pt: Cancela el comportamiento nativo del formulario (Submit) para evitar el refresco de página.
    // pn: Frena el comportamiento automático del navegador para que la página no se recargue sola.
    event.preventDefault();

    // pt: Convierte la propiedad value del elemento seleccionado en un tipo numérico (casting).
    // pn: Guarda el identificador del empleado elegido asegurándose de convertir el texto a número.
    const empleadoId = Number(selectAsistenciaEmpleado.value);

    // pt: Control de flujo que valida datos obligatorios antes de procesar el payload.
    // pn: Validación de seguridad. Si el usuario no seleccionó a nadie, muestra un aviso y detiene el proceso.
    if (selectAsistenciaEmpleado.value === "") {
        alert("Seleccione un empleado.");
        return;
    }

    // pt: Instancia un objeto literal de JavaScript que representa la entidad Asistencia.
    // pn: Preparamos la cajita con la información empaquetada: el ID del empleado, la fecha de hoy en formato local y el estado "Presente".
    const nuevaAsistencia = {
        empleadoId: empleadoId,
        fecha: new Date().toLocaleDateString("es-AR"),
        estado: "Presente"
    };

    try {
        // pt: Realiza un envío asíncrono POST para persistir la entidad en el backend.
        // pn: Envía la tarjeta al servidor para que quede guardada definitivamente.
        await axios.post(`${API_URL}/asistencias`, nuevaAsistencia);

        // pt: Invoca el método reset para limpiar el estado de los controles del formulario.
        // pn: Borra todo lo que escribimos en pantalla para dejar el formulario limpito de nuevo.
        formAsistencia.reset();

        // pt: Actualiza la vista de registros invocando la recarga de datos.
        // pn: Llama a la función de abajo para volver a leer la lista y mostrar la asistencia recién creada en la pantalla.
        await cargarAsistencias();
    } catch (error) {
        console.error("Error al registrar asistencia:", error);
    }
}

// pt: Implementa consultas con parámetros de filtrado opcionales (query strings).
// pn: Busca las asistencias guardadas en el servidor y, si elegimos un empleado, trae solo las de esa persona.
async function cargarAsistencias() {
    try {
        let url = `${API_URL}/asistencias`;

        // Si hay un empleado seleccionado en el filtro de la pantalla, modificamos la dirección añadiendo el filtro de ID
        if (filtroEmpleadoAsistencia.value !== "") {
            url = `${API_URL}/asistencias?empleadoId=${filtroEmpleadoAsistencia.value}`;
        }

        const responseAsistencias = await axios.get(url);
        const asistencias = responseAsistencias.data;

        const responseEmpleados = await axios.get(`${API_URL}/empleados`);
        const empleados = responseEmpleados.data;

        // Mandamos los datos a la función que arma la interfaz visual
        renderizarAsistencias(asistencias, empleados);
    } catch (error) {
        console.error("Error al cargar asistencias:", error);
    }
}

// pt: Manipula la propiedad innerHTML para renderizar dinámicamente plantillas literales de tarjetas de asistencias.
// pn: Borra lo que había en pantalla y dibuja de nuevo las tarjetas de asistencia con diseño HTML moderno de forma automática.
function renderizarAsistencias(asistencias, empleados) {
    contenedorAsistencias.innerHTML = "";

    if (asistencias.length === 0) {
        contenedorAsistencias.innerHTML = "<p>No hay asistencias registradas.</p>";
        return;
    }

    // pt: Invierte el orden del array para mostrar una ordenación cronológica inversa.
    // pn: Da vuelta la lista de asistencias para que los registros más nuevos aparezcan arriba de todo.
    asistencias.reverse();

    asistencias.forEach(function(asistencia) {
        // pt: Utiliza el método .find() de orden superior para correlacionar claves foráneas.
        // pn: Busca en la lista de empleados cuál de todos coincide con el ID que está guardado en la asistencia.
        const empleado = empleados.find(function(emp) {
            return emp.id === asistencia.empleadoId;
        });

        // Operador ternario: Si el empleado existe muestra su nombre, de lo contrario indica que fue removido de la base de datos
        const nombreEmpleado = empleado ? empleado.nombre : "Empleado eliminado";

        // Añadimos el bloque visual de la tarjeta con funciones "onclick" listas para responder a los clics del mouse
        contenedorAsistencias.innerHTML += `
            <div class="card">
                <h3>${nombreEmpleado}</h3>
                <p>Fecha: ${asistencia.fecha}</p>
                <p>Estado: ${asistencia.estado}</p>

                <button class="btn-edit" onclick="editarEstadoAsistencia(${asistencia.id}, 'Presente')">Presente</button>
                <button class="btn-edit" onclick="editarEstadoAsistencia(${asistencia.id}, 'Ausente')">Ausente</button>
                <button class="btn-edit" onclick="editarEstadoAsistencia(${asistencia.id}, 'Tardanza')">Tardanza</button>
                <button class="btn-danger" onclick="eliminarAsistencia(${asistencia.id})">Eliminar</button>
            </div>
        `;
    });
}

// pt: Actualiza de forma parcial un recurso en el servidor mediante el método HTTP PATCH.
// pn: Modifica únicamente el campo del estado (Presente/Ausente/Tardanza) sin tocar el resto de los datos de la asistencia.
async function editarEstadoAsistencia(id, nuevoEstado) {
    try {
        const datos = {
            estado: nuevoEstado
        };

        await axios.patch(`${API_URL}/asistencias/${id}`, datos);

        await cargarAsistencias();
    } catch (error) {
        console.error("Error al editar asistencia:", error);
    }
}

// pt: Remueve un recurso de la API REST mediante una llamada con el método DELETE.
// pn: Elimina de forma permanente un renglón de asistencia utilizando su número identificador único.
async function eliminarAsistencia(id) {
    // Cuadro de confirmación integrado del navegador
    const confirmar = confirm("¿Seguro que desea eliminar esta asistencia?");

    if (!confirmar) {
        return;
    }

    try {
        await axios.delete(`${API_URL}/asistencias/${id}`);

        await cargarAsistencias();
    } catch (error) {
        console.error("Error al eliminar asistencia:", error);
    }
}


// =========================================================================
// SECCIÓN DE DEPARTAMENTOS (LÓGICA Y DATOS)
// =========================================================================

// pt: Coordina solicitudes paralelas concurrentes para obtener departamentos y empleados.
// pn: Se conecta a la base de datos para traer las carpetas de departamentos y la lista completa de personas.
async function cargarDepartamentos() {
    try {
        const responseDepartamentos = await axios.get(`${API_URL}/departamentos`);
        const departamentos = responseDepartamentos.data;

        const responseEmpleados = await axios.get(`${API_URL}/empleados`);
        const empleados = responseEmpleados.data;

        renderizarDepartamentos(departamentos, empleados);
    } catch (error) {
        console.error("Error al cargar departamentos:", error);
    }
}

// pt: Popula las opciones de los controles select vinculados a la entidad Departamento.
// pn: Carga los nombres de las áreas (como Ventas o RRHH) dentro de las opciones de los formularios desplegables.
async function cargarSelectDepartamentos() {
    try {
        const response = await axios.get(`${API_URL}/departamentos`);
        const departamentos = response.data;

        selectEmpleadoDepartamento.innerHTML = `
            <option value="">Seleccione departamento</option>
        `;

        filtroDepartamento.innerHTML = `
            <option value="">Todos los departamentos</option>
        `;

        departamentos.forEach(function(departamento) {
            selectEmpleadoDepartamento.innerHTML += `
                <option value="${departamento.id}">${departamento.nombre}</option>
            `;

            filtroDepartamento.innerHTML += `
                <option value="${departamento.id}">${departamento.nombre}</option>
            `;
        });
    } catch (error) {
        console.error("Error al cargar departamentos en selects:", error);
    }
}

// pt: Renderiza la interfaz de departamentos aplicando un filtro de longitud para calcular métricas asociadas.
// pn: Muestra los departamentos en pantalla calculando cuántos empleados activos pertenecen a cada sector usando .filter.
function renderizarDepartamentos(departamentos, empleados) {
    contenedorDepartamentos.innerHTML = "";

    departamentos.forEach(function(departamento) {
        // Filtramos para contar cuántas personas coinciden con el ID del departamento actual
        const empleadosDelDepartamento = empleados.filter(function(empleado) {
            return empleado.departamentoId === departamento.id;
        });

        contenedorDepartamentos.innerHTML += `
            <div class="card">
                <h3>${departamento.nombre}</h3>
                <p>Responsable: ${departamento.responsable}</p>
                <p>Cantidad de empleados: ${empleadosDelDepartamento.length}</p>

                <button class="btn-edit" onclick="editarDepartamento(${departamento.id})">Editar</button>
                <button  class="btn-danger" onclick="eliminarDepartamento(${departamento.id})">Eliminar</button>
            </div>
        `;
       
    });
}

// pt: Aplica lógica condicional para discernir entre operaciones de inserción (POST) y actualización (PATCH).
// pn: Guarda el departamento. Si la cajita oculta de ID está vacía asume que es uno nuevo, si tiene número asume que estamos editando uno existente.
async function guardarDepartamento(event) {
    event.preventDefault();

    // El método .trim() sanitiza las cadenas removiendo espacios vacíos en los extremos
    const nombre = inputDepartamentoNombre.value.trim();
    const responsable = inputDepartamentoResponsable.value.trim();

    if (nombre === "" || responsable === "") {
        alert("Complete el nombre del departamento y el responsable.");
        return;
    }

    const datosDepartamento = {
        nombre: nombre,
        responsable: responsable
    };

    try {
        if (inputDepartamentoId.value === "") {
            // No hay ID: Petición HTTP POST para dar de alta
            await axios.post(`${API_URL}/departments`, datosDepartamento);
        } else {
            // Hay ID: Petición HTTP PATCH para actualizar datos existentes
            await axios.patch(`${API_URL}/departamentos/${inputDepartamentoId.value}`, datosDepartamento);
        }

        formDepartamento.reset();
        inputDepartamentoId.value = "";

        await cargarDatos();
    } catch (error) {
        console.error("Error al guardar departamento:", error);
    }
}

// pt: Realiza una petición GET por ID y mapea la respuesta a los campos del formulario de edición.
// pn: Busca un departamento específico y rellena el formulario de la pantalla con sus datos actuales para poder editarlos.
async function editarDepartamento(id) {
    try {
        const response = await axios.get(`${API_URL}/departamentos/${id}`);
        const departamento = response.data;

        inputDepartamentoId.value = departamento.id;
        inputDepartamentoNombre.value = departamento.nombre;
        inputDepartamentoResponsable.value = departamento.responsable;
    } catch (error) {
        console.error("Error al cargar departamento para editar:", error);
    }
}

// Limpia las entradas visuales si el usuario cancela la operación de edición actual
function cancelarEdicionDepartamento() {
    formDepartamento.reset();
    inputDepartamentoId.value = "";
}

// pt: Implementa una desestructuración o eliminación en cascada simulada en el cliente para mantener la integridad referencial.
// pn: Borrado seguro: Para poder borrar un departamento, primero busca a sus empleados, les elimina todas sus asistencias individuales, los borra a ellos, y finalmente borra el departamento para no dejar datos huérfanos.
async function eliminarDepartamento(id) {
    const confirmar = confirm("¿Seguro que desea eliminar este departamento y todos sus datos asociados?");

    if (!confirmar) {
        return;
    }

    try {
        // 1. Buscamos qué empleados pertenecen al departamento que queremos remover
        const responseEmpleados = await axios.get(`${API_URL}/empleados?departamentoId=${id}`);
        const empleados = responseEmpleados.data;

        // 2. Iteramos concurrentemente sobre los empleados del sector
        for (const empleado of empleados) {
            const responseAsistencias = await axios.get(`${API_URL}/asistencias?empleadoId=${empleado.id}`);
            const asistencias = responseAsistencias.data;

            // Borramos todas las asistencias vinculadas a este empleado en particular
            for (const asistencia of asistencias) {
                await axios.delete(`${API_URL}/asistencias/${asistencia.id}`);
            }

            // Una vez libre de asistencias vinculadas, eliminamos el perfil del empleado
            await axios.delete(`${API_URL}/empleados/${empleado.id}`);
        }

        // 3. Cuando ya no quedan dependencias rotas en la base de datos, removemos el departamento definitivo
        await axios.delete(`${API_URL}/departamentos/${id}`);

        await cargarDatos();
    } catch (error) {
        console.error("Error al eliminar departamento:", error);
    }
}


// =========================================================================
// SECCIÓN DE EMPLEADOS (LÓGICA Y DATOS)
// =========================================================================

// pt: Evalúa condiciones de filtrado reactivas para componer la URI de consulta de empleados.
// pn: Trae la lista de empleados de la API. Si en pantalla elegimos filtrar por un departamento, modifica la consulta para traer solo a los de ese grupo.
async function cargarEmpleados() {
    try {
        let url = `${API_URL}/empleados`;

        if (filtroDepartamento.value !== "") {
            url = `${API_URL}/empleados?departamentoId=${filtroDepartamento.value}`;
        }

        const responseEmpleados = await axios.get(url);
        const empleados = responseEmpleados.data;

        const responseDepartamentos = await axios.get(`${API_URL}/departamentos`);
        const departamentos = responseDepartamentos.data;

        renderizarEmpleados(empleados, departamentos);
    } catch (error) {
        console.error("Error al cargar empleados:", error);
    }
}

// pt: Itera y procesa colecciones cruzadas inyectando elementos estructurados al contenedor correspondiente.
// pn: Agarra la lista de personas y genera las tarjetas HTML individuales de cada empleado mostrando sus puestos de trabajo y el nombre de su área.
function renderizarEmpleados(empleados, departamentos) {
    contenedorEmpleados.innerHTML = "";

    if (empleados.length === 0) {
        contenedorEmpleados.innerHTML = "<p>No hay empleados para mostrar.</p>";
        return;
    }

    empleados.forEach(function(empleado) {
        // Cruzamos datos: buscamos la correspondencia entre el ID del departamento del empleado y la lista de departamentos globales
        const departamento = departamentos.find(function(dep) {
            return dep.id === empleado.departamentoId;
        });

        const nombreDepartamento = departamento ? departamento.nombre : "Sin departamento";

        contenedorEmpleados.innerHTML += `
            <div class="card">
                <h3>${empleado.nombre}</h3>
                <p>Cargo: ${empleado.cargo}</p>
                <p>Departamento: ${nombreDepartamento}</p>
                <p>Fecha de ingreso: ${empleado.fechaIngreso}</p>

                <button class="btn-edit" onclick="editarEmpleado(${empleado.id})">Editar</button>
                <button class="btn-danger" onclick="eliminarEmpleado(${empleado.id})">Eliminar</button>
            </div>
        `;
    });
}

// pt: Envía el estado del formulario de empleados encapsulando las propiedades requeridas por el modelo del backend.
// pn: Lee los casilleros de texto y registra el empleado en el sistema (Crea con POST si es nuevo, modifica con PATCH si tiene ID).
async function guardarEmpleado(event) {
    event.preventDefault();

    const nombre = inputEmpleadoNombre.value.trim();
    const cargo = inputEmpleadoCargo.value.trim();
    const fechaIngreso = inputEmpleadoFecha.value;
    const departamentoId = Number(selectEmpleadoDepartamento.value);

    if (nombre === "" || cargo === "" || fechaIngreso === "" || selectEmpleadoDepartamento.value === "") {
        alert("Complete todos los datos del empleado.");
        return;
    }

    const datosEmpleado = {
        nombre: nombre,
        cargo: cargo,
        fechaIngreso: fechaIngreso,
        departamentoId: departamentoId
    };

    try {
        if (inputEmpleadoId.value === "") {
            await axios.post(`${API_URL}/empleados`, datosEmpleado);
        } else {
            await axios.patch(`${API_URL}/empleados/${inputEmpleadoId.value}`, datosEmpleado);
        }

        formEmpleado.reset();
        inputEmpleadoId.value = "";

        await cargarEmpleados();
        await cargarDepartamentos(); // Volvemos a calcular los contadores numéricos de las tarjetas de áreas
    } catch (error) {
        console.error("Error al guardar empleado:", error);
    }
}

// pt: Recupera un recurso por identificador y asocia sus propiedades al formulario de entrada de datos.
// pn: Cuando presionas "Editar", trae los campos guardados de esa persona del servidor y los mete en las cajas de texto del formulario.
async function editarEmpleado(id) {
    try {
        const response = await axios.get(`${API_URL}/empleados/${id}`);
        const empleado = response.data;

        inputEmpleadoId.value = empleado.id;
        inputEmpleadoNombre.value = empleado.nombre;
        inputEmpleadoCargo.value = empleado.cargo;
        inputEmpleadoFecha.value = empleado.fechaIngreso;
        selectEmpleadoDepartamento.value = empleado.departamentoId;
    } catch (error) {
        console.error("Error al cargar empleado para editar:", error);
    }
}

// Resetea el formulario de gestión de perfiles de personal
function cancelarEdicionEmpleado() {
    formEmpleado.reset();
    inputEmpleadoId.value = "";
}

// pt: Remueve de forma segura un empleado de la persistencia depurando previamente sus registros en tablas vinculadas.
// pn: Elimina un trabajador eliminando primero todas sus faltas y asistencias acumuladas de la base de datos para prevenir errores relacionales.
async function eliminarEmpleado(id) {
}
    const confirmar = confirm("¿Seguro que desea eliminar este empleado y sus asistencias?");

    if (!confirmar) {
        return;
    }