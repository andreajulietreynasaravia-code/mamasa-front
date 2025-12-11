// Obtener URLs de API usando variables de entorno
const MENU_SERVICE_URL = (typeof window !== 'undefined' && window.config && window.config.API_CONFIG && window.config.API_CONFIG.menu) 
  ? window.config.API_CONFIG.menu 
  : (typeof process !== 'undefined' && process.env?.MENU_SERVICE_URL) 
    ? `${process.env.MENU_SERVICE_URL}/api` 
    : "http://localhost:4000/api";
const API_PLATOS = `${MENU_SERVICE_URL}/menu`;
const API_CATEGORIAS = `${MENU_SERVICE_URL}/categorias`;

    // 🔹 Cargar categorías
    async function cargarCategorias() {
      try {
        const tabla = document.getElementById("tablaCategorias");
        const selectCategoria = document.getElementById("categoria");
        const selectEditCategoria = document.getElementById("editarCategoria");
        
        if (!tabla || !selectCategoria) {
          console.warn("⚠️ Elementos de categorías no encontrados");
          return;
        }
        
        const res = await fetch(API_CATEGORIAS);
        
        if (!res.ok) {
          if (res.status === 404) {
            tabla.innerHTML = `
              <tr>
                <td colspan="3" style="text-align: center; padding: 2rem; color: #999;">
                  No hay categorías creadas. Crea una nueva categoría arriba.
                </td>
              </tr>
            `;
            selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
            if (selectEditCategoria) {
              selectEditCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
            }
            return;
          }
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        
        const categorias = await res.json();
        
        // Limpiar tabla
        tabla.innerHTML = "";
        
        // Limpiar selects y agregar opción por defecto
        selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
        if (selectEditCategoria) {
          selectEditCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
        }
        
        if (!categorias || categorias.length === 0) {
          tabla.innerHTML = `
            <tr>
              <td colspan="3" style="text-align: center; padding: 2rem; color: #999;">
                No hay categorías creadas. Crea una nueva categoría arriba.
              </td>
            </tr>
          `;
        } else {
          // Mostrar categorías en la tabla
          categorias.forEach(categoria => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td><strong>${categoria.nombre || "-"}</strong></td>
              <td>${categoria.descripcion || "-"}</td>
              <td>
                <button onclick="eliminarCategoria('${categoria._id}')" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 0.5rem 1rem; font-size: 0.9rem; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">🗑️ Eliminar</button>
              </td>
            `;
            tabla.appendChild(tr);
          });
          
          // Agregar categorías a los selects
          categorias.forEach(categoria => {
            const option = document.createElement("option");
            option.value = categoria.nombre;
            option.textContent = categoria.nombre;
            selectCategoria.appendChild(option);
            
            if (selectEditCategoria) {
              const optionEdit = document.createElement("option");
              optionEdit.value = categoria.nombre;
              optionEdit.textContent = categoria.nombre;
              selectEditCategoria.appendChild(optionEdit);
            }
          });
        }
      } catch (error) {
        console.error("❌ Error cargando categorías:", error);
        const tabla = document.getElementById("tablaCategorias");
        if (tabla) {
          tabla.innerHTML = `
            <tr>
              <td colspan="3" style="text-align: center; padding: 2rem; color: #dc3545;">
                ⚠️ Error al cargar las categorías. Verifica que el servidor esté corriendo.
              </td>
            </tr>
          `;
        }
      }
    }

    // 🔹 Crear categoría
    document.getElementById("formCategoria").addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombreCategoria").value.trim();
      const descripcion = document.getElementById("descripcionCategoria").value.trim();

      if (!nombre) {
        alert("❌ El nombre de la categoría es requerido");
        return;
      }

      try {
        const res = await fetch(API_CATEGORIAS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombre,
            descripcion: descripcion || undefined
          })
        });

        if (res.ok) {
          alert("✅ Categoría creada con éxito");
          e.target.reset();
          cargarCategorias();
        } else {
          const error = await res.json();
          throw new Error(error.error || "Error al crear categoría");
        }
      } catch (error) {
        console.error("Error creando categoría:", error);
        alert(`❌ Error al crear categoría: ${error.message}`);
      }
    });

    // 🔹 Eliminar categoría
    async function eliminarCategoria(id) {
      if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?\n\n⚠️ Esta acción no se puede deshacer.")) {
        return;
      }

      try {
        const res = await fetch(`${API_CATEGORIAS}/${id}`, {
          method: "DELETE"
        });

        if (res.ok) {
          alert("✅ Categoría eliminada correctamente");
          cargarCategorias();
        } else {
          const error = await res.json();
          throw new Error(error.error || "Error al eliminar categoría");
        }
      } catch (error) {
        console.error("Error eliminando categoría:", error);
        alert(`❌ Error al eliminar categoría: ${error.message}`);
      }
    }

    // 🔹 Cargar platos
    async function cargarPlatos() {
      try {
        const res = await fetch(API_PLATOS);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        
        const platos = await res.json();
        const tabla = document.getElementById("tablaPlatos");
        tabla.innerHTML = "";

        if (!platos || platos.length === 0) {
          tabla.innerHTML = `
            <tr>
              <td colspan="5" class="empty-state">
                No hay platos disponibles. Agrega un nuevo plato arriba.
              </td>
            </tr>
          `;
          return;
        }

        platos.forEach(plato => {
          const tr = document.createElement("tr");
          const imagenUrl = plato.imagen ? `http://localhost:4000${plato.imagen}` : 'https://via.placeholder.com/100?text=Sin+Imagen';
          tr.innerHTML = `
            <td>
              <img src="${imagenUrl}" alt="${plato.nombre}" style="max-width: 100px; height: auto; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/100?text=Sin+Imagen'" />
            </td>
            <td><strong>${plato.nombre || "-"}</strong></td>
            <td>${plato.categoria || "-"}</td>
            <td>S/ ${plato.precio ? plato.precio.toFixed(2) : "0.00"}</td>
            <td>
              <div class="btn-acciones">
                <button class="btn-editar" onclick="editarPlato('${plato._id}')">✏️ Editar</button>
                <button onclick="eliminarPlato('${plato._id}')">🗑️ Eliminar</button>
              </div>
            </td>
          `;
          tabla.appendChild(tr);
        });
      } catch (error) {
        console.error("❌ Error cargando platos:", error);
        const tabla = document.getElementById("tablaPlatos");
        tabla.innerHTML = `
          <tr>
            <td colspan="5" class="empty-state" style="color: #dc3545;">
              ❌ Error al cargar los platos: ${error.message}<br>
              <small>Verifica que el servidor esté corriendo en http://localhost:4000</small>
            </td>
          </tr>
        `;
      }
    }

    // 🔹 Agregar plato (con imagen)
    document.getElementById("formPlato").addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("nombre", document.getElementById("nombre").value);
      formData.append("descripcion", document.getElementById("descripcion").value);
      formData.append("precio", parseFloat(document.getElementById("precio").value));
      formData.append("categoria", document.getElementById("categoria").value);

      const imagenFile = document.getElementById("imagen").files[0];
      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }

      try {
        const res = await fetch(API_PLATOS, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          alert("✅ Plato agregado con éxito");
          e.target.reset();
          cargarPlatos();
        } else {
          const error = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error || "Error al agregar plato");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al agregar plato: " + error.message);
      }
    });

    // 🔹 Editar plato - Abrir modal
    async function editarPlato(id) {
      try {
        // Cargar datos del plato
        const res = await fetch(`${API_PLATOS}/${id}`);
        if (!res.ok) throw new Error("Error al cargar el plato");
        
        const plato = await res.json();
        
        // Llenar el formulario
        document.getElementById("editarId").value = plato._id;
        document.getElementById("editarNombre").value = plato.nombre || "";
        document.getElementById("editarDescripcion").value = plato.descripcion || "";
        document.getElementById("editarPrecio").value = plato.precio || "";
        
        // Cargar categorías en el select de edición
        const selectEditCategoria = document.getElementById("editarCategoria");
        selectEditCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
        
        const categoriasRes = await fetch(API_CATEGORIAS);
        if (categoriasRes.ok) {
          const categorias = await categoriasRes.json();
          categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.nombre;
            option.textContent = cat.nombre;
            if (cat.nombre === plato.categoria) {
              option.selected = true;
            }
            selectEditCategoria.appendChild(option);
          });
        }
        
        // Mostrar imagen actual
        const imagenActualDiv = document.getElementById("imagenActual");
        if (plato.imagen) {
          imagenActualDiv.innerHTML = `
            <div style="margin-top: 10px;">
              <strong>Imagen actual:</strong><br>
              <img src="http://localhost:4000${plato.imagen}" alt="${plato.nombre}" style="max-width: 200px; max-height: 150px; border-radius: 8px; margin-top: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
            </div>
          `;
        } else {
          imagenActualDiv.innerHTML = "";
        }
        
        // Mostrar modal
        document.getElementById("modalEditar").style.display = "block";
      } catch (error) {
        console.error("Error cargando plato:", error);
        alert("❌ Error al cargar el plato: " + error.message);
      }
    }
    
    // 🔹 Cerrar modal de edición
    function cerrarModalEditar() {
      document.getElementById("modalEditar").style.display = "none";
      document.getElementById("formEditarPlato").reset();
      document.getElementById("imagenActual").innerHTML = "";
      document.getElementById("editarImagen").value = "";
    }
    
    // 🔹 Actualizar plato
    document.getElementById("formEditarPlato").addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const id = document.getElementById("editarId").value;
      const formData = new FormData();
      
      formData.append("nombre", document.getElementById("editarNombre").value.trim());
      formData.append("descripcion", document.getElementById("editarDescripcion").value.trim());
      formData.append("precio", document.getElementById("editarPrecio").value);
      formData.append("categoria", document.getElementById("editarCategoria").value);
      
      const imagenFile = document.getElementById("editarImagen").files[0];
      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }
      
      try {
        const res = await fetch(`${API_PLATOS}/${id}`, {
          method: "PUT",
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          alert("✅ Plato actualizado con éxito");
          cerrarModalEditar();
          cargarPlatos();
        } else {
          const error = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error || "Error al actualizar plato");
        }
      } catch (error) {
        console.error("Error actualizando plato:", error);
        alert("❌ Error al actualizar plato: " + error.message);
      }
    });

    // 🔹 Eliminar plato
    async function eliminarPlato(id) {
      if (!confirm("¿Estás seguro de que quieres eliminar este plato?\n\n⚠️ Esta acción no se puede deshacer.")) return;
      
      try {
        const res = await fetch(`${API_PLATOS}/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("✅ Plato eliminado correctamente");
          cargarPlatos();
        } else {
          const error = await res.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error || "Error al eliminar");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al eliminar: " + error.message);
      }
    }

    // Cerrar modal al hacer click fuera
    window.onclick = function(event) {
      const modal = document.getElementById("modalEditar");
      if (event.target === modal) {
        cerrarModalEditar();
      }
    }

    // 🔹 Inicializar
    cargarCategorias();
    cargarPlatos();
    
    // Exponer funciones globalmente
    window.eliminarCategoria = eliminarCategoria;
    window.eliminarPlato = eliminarPlato;
    window.editarPlato = editarPlato;
    window.cerrarModalEditar = cerrarModalEditar;