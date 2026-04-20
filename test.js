console.log("Iniciando pruebas Mamasa Front...");

// Verificar que el servidor exista
const fs = require('fs');

if (!fs.existsSync('./server.js')) {
    throw new Error("server.js no existe");
}

console.log("Servidor encontrado");

// Simular prueba de estructura
if (!fs.existsSync('./componentes')) {
    throw new Error("Carpeta componentes no encontrada");
}

console.log("Componentes encontrados");

// prueba exitosa
console.log("Todas las pruebas pasaron correctamente");
