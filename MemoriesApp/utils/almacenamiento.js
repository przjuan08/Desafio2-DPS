import AsyncStorage from "@react-native-async-storage/async-storage"

// Clave para almacenar los recuerdos en AsyncStorage
const RECUERDOS_STORAGE_KEY = "@memories_app_recuerdos"

/**
 * Obtiene todos los recuerdos almacenados
 * @returns {Promise<Array>} Array de recuerdos
 */
export const obtenerRecuerdos = async () => {
  try {
    const recuerdosJSON = await AsyncStorage.getItem(RECUERDOS_STORAGE_KEY)
    console.log("Recuerdos obtenidos (JSON):", recuerdosJSON)

    if (recuerdosJSON !== null) {
      const recuerdos = JSON.parse(recuerdosJSON)
      console.log("Recuerdos parseados:", recuerdos)
      return recuerdos
    }

    console.log("No hay recuerdos almacenados, devolviendo array vacío")
    return []
  } catch (error) {
    console.error("Error al obtener recuerdos:", error)
    // En caso de error, devolvemos un array vacío para evitar que la app se rompa
    return []
  }
}

/**
 * Guarda un nuevo recuerdo
 * @param {Object} recuerdo - Objeto con los datos del recuerdo
 * @returns {Promise<void>}
 */
export const guardarRecuerdo = async (recuerdo) => {
  try {
    // Obtener recuerdos existentes
    const recuerdosActuales = await obtenerRecuerdos()
    console.log("Recuerdos actuales antes de guardar:", recuerdosActuales)

    // Añadir el nuevo recuerdo
    const nuevosRecuerdos = [...recuerdosActuales, recuerdo]
    console.log("Nuevos recuerdos a guardar:", nuevosRecuerdos)

    // Guardar en AsyncStorage
    const jsonValue = JSON.stringify(nuevosRecuerdos)
    await AsyncStorage.setItem(RECUERDOS_STORAGE_KEY, jsonValue)
    console.log("Recuerdos guardados exitosamente")
  } catch (error) {
    console.error("Error al guardar recuerdo:", error)
    throw error
  }
}

/**
 * Elimina un recuerdo por su ID
 * @param {string} id - ID del recuerdo a eliminar
 * @returns {Promise<void>}
 */
export const eliminarRecuerdo = async (id) => {
  try {
    // Obtener recuerdos existentes
    const recuerdosActuales = await obtenerRecuerdos()

    // Filtrar el recuerdo a eliminar
    const nuevosRecuerdos = recuerdosActuales.filter((recuerdo) => recuerdo.id !== id)

    // Guardar en AsyncStorage
    await AsyncStorage.setItem(RECUERDOS_STORAGE_KEY, JSON.stringify(nuevosRecuerdos))
    console.log("Recuerdo eliminado exitosamente:", id)
  } catch (error) {
    console.error("Error al eliminar recuerdo:", error)
    throw error
  }
}

/**
 * Limpia todos los recuerdos (para depuración)
 * @returns {Promise<void>}
 */
export const limpiarRecuerdos = async () => {
  try {
    await AsyncStorage.removeItem(RECUERDOS_STORAGE_KEY)
    console.log("Todos los recuerdos han sido eliminados")
  } catch (error) {
    console.error("Error al limpiar recuerdos:", error)
    throw error
  }
}

/**
 * Edita la descripción de un recuerdo por su ID
 * @param {string} id - ID del recuerdo a editar
 * @param {string} nuevaDescripcion - Nueva descripción para el recuerdo
 * @returns {Promise<void>}
 */
export const editarDescripcionRecuerdo = async (id, nuevaDescripcion) => {
  try {
    // Obtener los recuerdos actuales
    const recuerdosActuales = await obtenerRecuerdos()

    // Verificar si el recuerdo existe y si la descripción es diferente
    const recuerdoIndex = recuerdosActuales.findIndex((recuerdo) => recuerdo.id === id)

    if (recuerdoIndex === -1) {
      console.error("Recuerdo no encontrado con el ID:", id)
      return
    }

    // Modificar la descripción solo si es diferente
    const recuerdoAEditar = recuerdosActuales[recuerdoIndex]
    if (recuerdoAEditar.descripcion === nuevaDescripcion) {
      console.log("La descripción es la misma, no se realiza ningún cambio.")
      return
    }

    // Actualizar la descripción
    recuerdosActuales[recuerdoIndex].descripcion = nuevaDescripcion
    console.log("Descripción actualizada para el recuerdo:", id)

    // Guardar los recuerdos editados en AsyncStorage
    await AsyncStorage.setItem(RECUERDOS_STORAGE_KEY, JSON.stringify(recuerdosActuales))
    console.log("Recuerdo actualizado y guardado correctamente.")
  } catch (error) {
    console.error("Error al editar descripción del recuerdo:", error)
    throw error
  }
}
