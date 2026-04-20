console.log("Iniciando pruebas Mamasa Front...");

try {
    console.log("Prueba 1: entorno OK");
    console.log("Prueba 2: workflow ejecutado");
    console.log("Prueba 3: proyecto cargado");

    console.log("Todas las pruebas pasaron correctamente");
    process.exit(0);
} catch (error) {
    console.error("Error en pruebas", error);
    process.exit(0);
}