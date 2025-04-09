"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Video } from "expo-av";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { obtenerRecuerdos, eliminarRecuerdo } from "../utils/almacenamiento";

const PantallaRecuerdos = () => {
  const [recuerdos, setRecuerdos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [recuerdoSeleccionado, setRecuerdoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [vistaActual, setVistaActual] = useState("lista"); // "lista" o "mapa"

  // Cargar recuerdos al montar el componente
  useEffect(() => {
    cargarRecuerdos();
  }, []);

  // Función para cargar los recuerdos desde el almacenamiento
  const cargarRecuerdos = async () => {
    setCargando(true);
    try {
      const recuerdosGuardados = await obtenerRecuerdos();
      setRecuerdos(recuerdosGuardados.reverse()); // Más recientes primero
    } catch (error) {
      console.error("Error al cargar recuerdos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para eliminar un recuerdo
  const borrarRecuerdo = async (id) => {
    try {
      await eliminarRecuerdo(id);
      // Actualizar la lista de recuerdos
      setRecuerdos(recuerdos.filter((recuerdo) => recuerdo.id !== id));
      // Cerrar el modal si está abierto
      if (recuerdoSeleccionado && recuerdoSeleccionado.id === id) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error al eliminar recuerdo:", error);
    }
  };

  // Estados para editar la descripción
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  // Iniciar edición
  const editarDescripcion = () => {
    setNuevaDescripcion(recuerdoSeleccionado.descripcion || "");
    setModoEdicion(true);
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setModoEdicion(false);
    setNuevaDescripcion("");
  };

  // Guardar nueva descripción
  const guardarDescripcion = () => {
    const actualizados = recuerdos.map((recuerdo) =>
      recuerdo.id === recuerdoSeleccionado.id
        ? { ...recuerdo, descripcion: nuevaDescripcion }
        : recuerdo
    );
    setRecuerdos(actualizados);
    setRecuerdoSeleccionado({
      ...recuerdoSeleccionado,
      descripcion: nuevaDescripcion,
    });
    setModoEdicion(false);
  };

  // Función para abrir el modal con el recuerdo seleccionado
  const verRecuerdo = (recuerdo) => {
    setRecuerdoSeleccionado(recuerdo);
    setModalVisible(true);
  };

  // Renderizar cada item de la lista
  const renderItem = ({ item }) => {
    const fecha = new Date(item.fecha);
    const fechaFormateada = `${fecha.getDate()}/${
      fecha.getMonth() + 1
    }/${fecha.getFullYear()}`;

    return (
      <TouchableOpacity
        style={styles.tarjetaRecuerdo}
        onPress={() => verRecuerdo(item)}
      >
        <View style={styles.mediaContenedor}>
          {item.tipo === "foto" ? (
            <Image
              source={{ uri: item.uri }}
              style={styles.mediaThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mediaThumbnail}>
              <Image
                source={{ uri: item.uri }}
                style={[styles.mediaThumbnail, { opacity: 0.7 }]}
                resizeMode="cover"
              />
              <MaterialIcons
                name="play-circle-filled"
                size={40}
                color="#fff"
                style={styles.iconoPlay}
              />
            </View>
          )}
          <View style={styles.tipoIndicador}>
            <MaterialIcons
              name={item.tipo === "foto" ? "photo-camera" : "videocam"}
              size={16}
              color="#fff"
            />
          </View>
        </View>

        <View style={styles.infoRecuerdo}>
          <Text style={styles.descripcionRecuerdo} numberOfLines={2}>
            {item.descripcion || "Sin descripción"}
          </Text>

          <Text style={styles.fechaRecuerdo}>
            <MaterialIcons name="access-time" size={14} color="#777" />{" "}
            {fechaFormateada}
          </Text>

          {item.ubicacion && (
            <Text style={styles.ubicacionRecuerdo}>
              <MaterialIcons name="location-on" size={14} color="#777" />{" "}
              Ubicación guardada
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Renderizar el mapa con todos los recuerdos
  const renderMapa = () => {
    // Filtrar recuerdos que tienen ubicación
    const recuerdosConUbicacion = recuerdos.filter(
      (recuerdo) =>
        recuerdo.ubicacion &&
        recuerdo.ubicacion.latitud &&
        recuerdo.ubicacion.longitud
    );

    // Si no hay recuerdos con ubicación, mostrar mensaje
    if (recuerdosConUbicacion.length === 0) {
      return (
        <View style={styles.contenedorVacio}>
          <MaterialIcons name="location-off" size={64} color="#ccc" />
          <Text style={styles.textoVacio}>
            No hay recuerdos con ubicación guardada
          </Text>
        </View>
      );
    }

    // Calcular región inicial para mostrar todos los marcadores
    let minLat = recuerdosConUbicacion[0].ubicacion.latitud;
    let maxLat = recuerdosConUbicacion[0].ubicacion.latitud;
    let minLng = recuerdosConUbicacion[0].ubicacion.longitud;
    let maxLng = recuerdosConUbicacion[0].ubicacion.longitud;

    recuerdosConUbicacion.forEach((recuerdo) => {
      minLat = Math.min(minLat, recuerdo.ubicacion.latitud);
      maxLat = Math.max(maxLat, recuerdo.ubicacion.latitud);
      minLng = Math.min(minLng, recuerdo.ubicacion.longitud);
      maxLng = Math.max(maxLng, recuerdo.ubicacion.longitud);
    });

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
      longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
    };

    return (
      <MapView style={styles.mapaCompleto} initialRegion={region}>
        {recuerdosConUbicacion.map((recuerdo) => (
          <Marker
            key={recuerdo.id}
            coordinate={{
              latitude: recuerdo.ubicacion.latitud,
              longitude: recuerdo.ubicacion.longitud,
            }}
            title={recuerdo.descripcion || "Recuerdo"}
            description={new Date(recuerdo.fecha).toLocaleDateString()}
            onCalloutPress={() => verRecuerdo(recuerdo)}
          >
            <View style={styles.marcadorMapa}>
              <MaterialIcons
                name={recuerdo.tipo === "foto" ? "photo-camera" : "videocam"}
                size={18}
                color="#fff"
              />
            </View>
          </Marker>
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.contenedor}>
      {/* Selector de vista */}
      <View style={styles.selectorVista}>
        <TouchableOpacity
          style={[
            styles.botonVista,
            vistaActual === "lista" && styles.botonVistaActivo,
          ]}
          onPress={() => setVistaActual("lista")}
        >
          <MaterialIcons
            name="view-list"
            size={24}
            color={vistaActual === "lista" ? "#FF6B6B" : "#777"}
          />
          <Text
            style={[
              styles.textoBotonVista,
              vistaActual === "lista" && styles.textoBotonVistaActivo,
            ]}
          >
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.botonVista,
            vistaActual === "mapa" && styles.botonVistaActivo,
          ]}
          onPress={() => setVistaActual("mapa")}
        >
          <MaterialIcons
            name="map"
            size={24}
            color={vistaActual === "mapa" ? "#FF6B6B" : "#777"}
          />
          <Text
            style={[
              styles.textoBotonVista,
              vistaActual === "mapa" && styles.textoBotonVistaActivo,
            ]}
          >
            Mapa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      {cargando ? (
        <View style={styles.contenedorCentrado}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.textoCargando}>Cargando recuerdos...</Text>
        </View>
      ) : (
        <>
          {vistaActual === "lista" ? (
            // Vista de lista
            recuerdos.length > 0 ? (
              <FlatList
                data={recuerdos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listaContenedor}
              />
            ) : (
              <View style={styles.contenedorVacio}>
                <MaterialIcons name="photo-album" size={64} color="#ccc" />
                <Text style={styles.textoVacio}>
                  No tienes recuerdos guardados
                </Text>
                <Text style={styles.textoVacioSub}>
                  Captura fotos o videos para comenzar
                </Text>
              </View>
            )
          ) : (
            // Vista de mapa
            renderMapa()
          )}
        </>
      )}

      {/* Modal de detalle */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {recuerdoSeleccionado && (
          <View style={styles.modalContenedor}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FF6B6B" />
              </TouchableOpacity>

              <Text style={styles.modalTitulo}>
                {new Date(recuerdoSeleccionado.fecha).toLocaleDateString()}
              </Text>

              <TouchableOpacity
                style={styles.botonEliminar}
                onPress={() => borrarRecuerdo(recuerdoSeleccionado.id)}
              >
                <MaterialIcons name="delete" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </View>

            {/* Media */}
            <View style={styles.mediaDetalleContenedor}>
              {recuerdoSeleccionado.tipo === "foto" ? (
                <Image
                  source={{ uri: recuerdoSeleccionado.uri }}
                  style={styles.mediaDetalle}
                  resizeMode="contain"
                />
              ) : (
                <Video
                  source={{ uri: recuerdoSeleccionado.uri }}
                  style={styles.mediaDetalle}
                  useNativeControls
                  resizeMode="contain"
                  isLooping
                />
              )}
            </View>

            {/* Descripción */}
            <View style={styles.descripcionDetalleContenedor}>
              <Text style={styles.descripcionDetalleTitulo}>Descripción:</Text>
              {modoEdicion ? (
                <>
                  <TextInput
                    style={[
                      styles.descripcionDetalleTexto,
                      { backgroundColor: "#eee", padding: 10, borderRadius: 5 },
                    ]}
                    multiline
                    value={nuevaDescripcion}
                    onChangeText={setNuevaDescripcion}
                  />
                  <View
                    style={{ flexDirection: "row", marginTop: 10, gap: 10 }}
                  >
                    <TouchableOpacity
                      onPress={guardarDescripcion}
                      style={{
                        backgroundColor: "#4CAF50",
                        padding: 10,
                        borderRadius: 5,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Guardar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={cancelarEdicion}
                      style={{
                        backgroundColor: "#999",
                        padding: 10,
                        borderRadius: 5,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.descripcionDetalleTexto}>
                    {recuerdoSeleccionado.descripcion || "Sin descripción"}
                  </Text>
                  <TouchableOpacity
                    onPress={editarDescripcion}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#FF6B6B",
                      padding: 10,
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Editar descripción
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Mapa */}
            {recuerdoSeleccionado.ubicacion && (
              <View style={styles.mapaDetalleContenedor}>
                <Text style={styles.mapaDetalleTitulo}>Ubicación:</Text>
                <MapView
                  style={styles.mapaDetalle}
                  initialRegion={{
                    latitude: recuerdoSeleccionado.ubicacion.latitud,
                    longitude: recuerdoSeleccionado.ubicacion.longitud,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: recuerdoSeleccionado.ubicacion.latitud,
                      longitude: recuerdoSeleccionado.ubicacion.longitud,
                    }}
                  />
                </MapView>
                <Text style={styles.coordenadasTexto}>
                  Lat: {recuerdoSeleccionado.ubicacion.latitud.toFixed(6)}, Lon:{" "}
                  {recuerdoSeleccionado.ubicacion.longitud.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#e1f4ff",
  },
  contenedorCentrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textoCargando: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
  },
  selectorVista: {
    flexDirection: "row",
    backgroundColor: "#e1f4ff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  botonVista: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 10,
    borderRadius: 5,
  },
  botonVistaActivo: {
    backgroundColor: "#005581",
  },
  textoBotonVista: {
    marginLeft: 5,
    fontSize: 16,
    color: "#777",
  },
  textoBotonVistaActivo: {
    color: "#fff",
    fontWeight: "bold",
  },
  listaContenedor: {
    padding: 10,
  },
  tarjetaRecuerdo: {
    flexDirection: "row",
    backgroundColor: "#f4fafd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaContenedor: {
    width: 100,
    height: 100,
    position: "relative",
  },
  mediaThumbnail: {
    width: "100%",
    height: "100%",
  },
  tipoIndicador: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 4,
  },
  iconoPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
  },
  infoRecuerdo: {
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
  },
  descripcionRecuerdo: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  fechaRecuerdo: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },
  ubicacionRecuerdo: {
    fontSize: 14,
    color: "#777",
  },
  contenedorVacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  textoVacio: {
    fontSize: 18,
    color: "#777",
    marginTop: 10,
    textAlign: "center",
  },
  textoVacioSub: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  mapaCompleto: {
    flex: 1,
  },
  marcadorMapa: {
    backgroundColor: "#FF6B6B",
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: "#fff",
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
  botonCerrar: {
    padding: 5,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  botonEliminar: {
    padding: 5,
  },
  mediaDetalleContenedor: {
    height: 300,
    backgroundColor: "#000",
  },
  mediaDetalle: {
    width: "100%",
    height: "100%",
  },
  descripcionDetalleContenedor: {
    padding: 15,
    backgroundColor: "#f4fafd",
    marginVertical: 10,
  },
  descripcionDetalleTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  descripcionDetalleTexto: {
    fontSize: 16,
    color: "#555",
  },
  mapaDetalleContenedor: {
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  mapaDetalleTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  mapaDetalle: {
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 5,
  },
  coordenadasTexto: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
});

export default PantallaRecuerdos;
