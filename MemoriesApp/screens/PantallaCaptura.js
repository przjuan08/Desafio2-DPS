"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { Video } from "expo-av"
import * as MediaLibrary from 'expo-media-library'
import * as Location from "expo-location"
import { MaterialIcons } from "@expo/vector-icons"
import MapView, { Marker } from "react-native-maps"
import { guardarRecuerdo } from "../utils/almacenamiento"

const PantallaCaptura = ({ navigation }) => {
  // Referencias
  const cameraRef = useRef(null)

  // Estados para la cámara
  const [camaraFrontal, setCamaraFrontal] = useState(false)
  const [permisoCamera, requestPermisoCamera] = useCameraPermissions()
  const [permisoUbicacion, setPermisoUbicacion] = useState(null)
  const [permisoMediaLibrary, setPermisoMediaLibrary] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [camaraVisible, setCamaraVisible] = useState(true)

  // Estados para la captura
  const [modoCaptura, setModoCaptura] = useState("foto") // "foto" o "video"
  const [grabando, setGrabando] = useState(false)

  // Estados para la previsualización
  const [mediaCapturado, setMediaCapturado] = useState(null)
  const [tipoMedia, setTipoMedia] = useState(null) // "foto" o "video"
  const [descripcion, setDescripcion] = useState("")
  const [ubicacion, setUbicacion] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Solicitar permisos al cargar el componente
  useEffect(() => {
    ;(async () => {
      // Solicitar permiso de cámara
      if (!permisoCamera) {
        await requestPermisoCamera()
      }

      // Solicitar permiso de ubicación
      const { status: statusUbicacion } = await Location.requestForegroundPermissionsAsync()
      setPermisoUbicacion(statusUbicacion === "granted")

      // Solicitar permiso de biblioteca multimedia
      const { status: statusMediaLibrary } = await MediaLibrary.requestPermissionsAsync()
      setPermisoMediaLibrary(statusMediaLibrary === "granted")
    })()
  }, [])

  // Función para obtener la ubicación actual
  const obtenerUbicacion = async () => {
    if (permisoUbicacion) {
      try {
        const ubicacionActual = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Cambiado a Balanced para mejor rendimiento
        })

        return {
          latitud: ubicacionActual.coords.latitude,
          longitud: ubicacionActual.coords.longitude,
          timestamp: ubicacionActual.timestamp,
        }
      } catch (error) {
        console.error("Error al obtener ubicación:", error)
        // Retornamos una ubicación por defecto en caso de error
        return {
          latitud: 0,
          longitud: 0,
          timestamp: Date.now(),
        }
      }
    } else {
      // Retornamos una ubicación por defecto si no hay permiso
      return {
        latitud: 0,
        longitud: 0,
        timestamp: Date.now(),
      }
    }
  }

  // Función para tomar una foto
  const tomarFoto = async () => {
    if (cameraRef.current) {
      setCargando(true)
      try {
        // Capturar la foto
        const foto = await cameraRef.current.takePictureAsync({
          quality: 0.8, // Reducir calidad para mejor rendimiento
          skipProcessing: true, // Saltar procesamiento para evitar errores
        })

        // Obtener ubicación
        const ubicacionActual = await obtenerUbicacion()

        // Guardar datos en el estado
        setMediaCapturado(foto.uri)
        setTipoMedia("foto")
        setUbicacion(ubicacionActual)
        setModalVisible(true)
        setCamaraVisible(false)
      } catch (error) {
        console.error("Error al tomar foto:", error)
        Alert.alert("Error", "No se pudo capturar la foto")
      } finally {
        setCargando(false)
      }
    }
  }

  // Función para grabar video
  const grabarVideo = async () => {
    if (!cameraRef.current) return

    if (grabando) {
      // Detener grabación
      setGrabando(false)
      setCargando(true)
      try {
        await cameraRef.current.stopRecording()
      } catch (error) {
        console.error("Error al detener grabación:", error)
        Alert.alert("Error", "No se pudo detener la grabación")
        setCargando(false)
      }
    } else {
      // Iniciar grabación
      try {
        setGrabando(true)
        const ubicacionActual = await obtenerUbicacion()
        setUbicacion(ubicacionActual)

        // Configuración mejorada para la grabación
        cameraRef.current
          .recordAsync({
            maxDuration: 30, // Reducir a 30 segundos para evitar problemas
            quality: "480p", // Calidad más baja para mejor rendimiento
            mute: false,
            mirror: false,
          })
          .then((video) => {
            setMediaCapturado(video.uri)
            setTipoMedia("video")
            setModalVisible(true)
            setCamaraVisible(false)
            setGrabando(false)
            setCargando(false)
          })
          .catch((error) => {
            console.error("Error al grabar video:", error)
            Alert.alert("Error", "No se pudo grabar el video. Intenta de nuevo.")
            setGrabando(false)
            setCargando(false)
          })
      } catch (error) {
        console.error("Error al iniciar grabación:", error)
        Alert.alert("Error", "No se pudo iniciar la grabación")
        setGrabando(false)
      }
    }
  }



  const guardarVideo = async (videoUri, descripcion, ubicacion) => {
    try {
      // Solicitar permisos para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        alert("Se requieren permisos para guardar el video")
        return
      }
  
      // Guardar el video en la galería (esto lo mueve a almacenamiento permanente)
      const asset = await MediaLibrary.createAssetAsync(videoUri)
  
      const nuevoRecuerdo = {
        id: Date.now().toString(),
        tipo: 'video',
        uri: asset.uri, // Ruta del video guardado
        descripcion,
        ubicacion,
        fecha: new Date().toISOString()
      }
  
      await guardarRecuerdo(nuevoRecuerdo)
      console.log("Video guardado correctamente:", asset.uri)
    } catch (error) {
      console.error("Error al guardar video:", error)
    }
  }


  // Función para guardar el recuerdo
  const guardarMedia = async () => {
    if (!mediaCapturado) return

    setCargando(true)
    try {
      // Crear objeto con los datos del recuerdo
      const nuevoRecuerdo = {
        id: Date.now().toString(),
        uri: mediaCapturado,
        tipo: tipoMedia,
        descripcion: descripcion || "Sin descripción",
        ubicacion: ubicacion || { latitud: 0, longitud: 0 },
        fecha: new Date().toISOString(),
      }

      // Guardar en el almacenamiento local
      await guardarRecuerdo(nuevoRecuerdo)
      console.log("Recuerdo guardado:", nuevoRecuerdo)

      // Guardar en la galería del dispositivo
      if (permisoMediaLibrary) {
        await MediaLibrary.saveToLibraryAsync(mediaCapturado)
      }

      // Limpiar estados y cerrar modal
      setMediaCapturado(null)
      setDescripcion("")
      setModalVisible(false)
      setCamaraVisible(true)

      // Navegar a la pantalla de recuerdos
      navigation.navigate("Mis Recuerdos")
    } catch (error) {
      console.error("Error al guardar recuerdo:", error)
      Alert.alert("Error", "No se pudo guardar el recuerdo")
    } finally {
      setCargando(false)
    }
  }

  // Función para descartar el media capturado
  const descartarMedia = () => {
    setMediaCapturado(null)
    setDescripcion("")
    setModalVisible(false)
    setCamaraVisible(true)
  }

  // Cambiar entre cámara frontal y trasera
  const cambiarCamara = () => {
    setCamaraFrontal(!camaraFrontal)
  }

  // Si no hay permisos, mostrar mensaje
  if (!permisoCamera) {
    return (
      <View style={styles.contenedorCentrado}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.textoPermisos}>Cargando cámara...</Text>
      </View>
    )
  }

  if (!permisoCamera.granted) {
    return (
      <View style={styles.contenedorCentrado}>
        <MaterialIcons name="no-photography" size={64} color="#FF6B6B" />
        <Text style={styles.textoPermisos}>Necesitamos permiso para acceder a la cámara</Text>
        <TouchableOpacity style={styles.botonPermiso} onPress={requestPermisoCamera}>
          <Text style={styles.textoBotonPermiso}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.contenedor}>
      {camaraVisible ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={camaraFrontal ? "front" : "back"}
          videoStabilizationMode="auto"
        >
          {/* Botón para cambiar cámara */}
          <TouchableOpacity style={styles.botonCambiarCamara} onPress={cambiarCamara}>
            <View style={styles.botonCambiarCamaraInterior}>
              <MaterialIcons name="flip-camera-ios" size={30} color="#fff" />
              <Text style={styles.textoCambiarCamara}>Cambiar cámara</Text>
            </View>
          </TouchableOpacity>

          {/* Controles inferiores */}
          <View style={styles.controlesInferiores}>
            {/* Selector de modo */}
            <View style={styles.selectorModo}>
              <TouchableOpacity
                style={[styles.botonModo, modoCaptura === "foto" && styles.botonModoActivo]}
                onPress={() => setModoCaptura("foto")}
              >
                <MaterialIcons name="photo-camera" size={24} color="#fff" />
                <Text style={styles.textoModo}>Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonModo, modoCaptura === "video" && styles.botonModoActivo]}
                onPress={() => setModoCaptura("video")}
              >
                <MaterialIcons name="videocam" size={24} color="#fff" />
                <Text style={styles.textoModo}>Video</Text>
              </TouchableOpacity>
            </View>

            {/* Botón de captura */}
            <TouchableOpacity
              style={[styles.botonCaptura, grabando && styles.botonCapturaGrabando]}
              onPress={modoCaptura === "foto" ? tomarFoto : grabarVideo}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={grabando ? styles.botonCapturaInterior : null} />
              )}
            </TouchableOpacity>

            {/* Espacio para equilibrar el layout */}
            <View style={{ width: 80 }} />
          </View>
        </CameraView>
      ) : (
        <View style={styles.contenedorCentrado}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.textoPermisos}>Procesando captura...</Text>
        </View>
      )}

      {/* Modal de previsualización */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContenedor}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Vista previa</Text>
            <TouchableOpacity style={styles.botonCerrar} onPress={descartarMedia}>
              <MaterialIcons name="close" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {/* Previsualización del media */}
          <View style={styles.mediaContenedor}>
            {tipoMedia === "foto" ? (
              <Image source={{ uri: mediaCapturado }} style={styles.mediaPreview} resizeMode="contain" />
            ) : (
              <Video
                source={{ uri: mediaCapturado }}
                style={styles.mediaPreview}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            )}
          </View>

          {/* Campo de descripción */}
          <View style={styles.descripcionContenedor}>
            <TextInput
              style={styles.descripcionInput}
              placeholder="Añade una descripción a tu recuerdo..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              maxLength={200}
            />
          </View>

          {/* Mapa con ubicación */}
          {ubicacion && ubicacion.latitud !== 0 && ubicacion.longitud !== 0 && (
            <View style={styles.mapaContenedor}>
              <Text style={styles.mapaTexto}>Ubicación capturada:</Text>
              <MapView
                style={styles.mapa}
                initialRegion={{
                  latitude: ubicacion.latitud,
                  longitude: ubicacion.longitud,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: ubicacion.latitud,
                    longitude: ubicacion.longitud,
                  }}
                />
              </MapView>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.botonesAccion}>
            <TouchableOpacity style={[styles.botonAccion, styles.botonDescartar]} onPress={descartarMedia}>
              <MaterialIcons name="delete" size={24} color="#fff" />
              <Text style={styles.textoBotonAccion}>Descartar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonAccion, styles.botonGuardar]}
              onPress={guardarMedia}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="save" size={24} color="#fff" />
                  <Text style={styles.textoBotonAccion}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenedorCentrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoPermisos: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  botonPermiso: {
    marginTop: 20,
    backgroundColor: "#005581",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  textoBotonPermiso: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
    justifyContent: "space-between",
  },
  controlesInferiores: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  selectorModo: {
    flexDirection: "row",
    backgroundColor: "rgba(46, 46, 46, 0.5)",
    borderRadius: 20,
    padding: 5,
  },
  botonModo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 15,
  },
  botonModoActivo: {
    backgroundColor: "rgba(30, 85, 136, 0.8)",
  },
  textoModo: {
    color: "#fff",
    marginLeft: 5,
  },
  botonCaptura: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ff5c5c",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  botonCapturaGrabando: {
    backgroundColor: "#f00",
  },
  botonCapturaInterior: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
  },

  // Estilos para el modal
  modalContenedor: {
    flex: 1,
    backgroundColor: "#e1f4ff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#005581",
    borderBottomWidth: 1,
    borderBottomColor: "#f4fafd",
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  botonCerrar: {
    padding: 5,
  },
  mediaContenedor: {
    height: 300,
    backgroundColor: "#e1f4ff",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  descripcionContenedor: {
    padding: 15,
    backgroundColor: "#f4fafd",
    marginVertical: 10,
  },
  descripcionInput: {
    height: 80,
    textAlignVertical: "top",
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f4fafd",
    borderRadius: 10,
  },
  mapaContenedor: {
    padding: 15,
    backgroundColor: "#f4fafd",
    marginBottom: 10,
  },
  mapaTexto: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  mapa: {
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
  },
  botonesAccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
  },
  botonAccion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  botonDescartar: {
    backgroundColor: "#777",
  },
  botonGuardar: {
    backgroundColor: "#005581",
  },
  textoBotonAccion: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
  },
  botonCambiarCamara: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 10,
    zIndex: 10,
  },
  botonCambiarCamaraInterior: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textoCambiarCamara: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "bold",
  },
})

export default PantallaCaptura
