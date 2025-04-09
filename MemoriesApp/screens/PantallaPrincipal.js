import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const PantallaPrincipal = ({ navigation }) => {
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          defaultSource={require("../assets/logo.png")}
        />
        <Text style={styles.titulo}>MemoriesApp</Text>
      </View>

      <Text style={styles.subtitulo}>Captura tus momentos especiales</Text>

      <View style={styles.tarjetasContenedor}>
        <TouchableOpacity
          style={styles.tarjeta}
          onPress={() => navigation.navigate("Capturar")}
        >
          <MaterialIcons name="camera-alt" size={48} color="#005581" />
          <Text style={styles.tarjetaTitulo}>Capturar</Text>
          <Text style={styles.tarjetaDescripcion}>
            Toma fotos o videos de tus momentos especiales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tarjeta}
          onPress={() => navigation.navigate("Mis Recuerdos")}
        >
          <MaterialIcons name="collections" size={48} color="#005581" />
          <Text style={styles.tarjetaTitulo}>Mis Recuerdos</Text>
          <Text style={styles.tarjetaDescripcion}>
            Revisa tus fotos y videos guardados
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContenedor}>
        <Text style={styles.infoTexto}>
          <MaterialIcons name="info" size={16} color="#777" />
          Tus recuerdos se guardan localmente en tu dispositivo
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e1f4ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003959",
  },
  subtitulo: {
    fontSize: 18,
    color: "#555",
    marginBottom: 30,
  },
  tarjetasContenedor: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  tarjeta: {
    backgroundColor: "#f4fafd",
    borderRadius: 15,
    padding: 20,
    width: "48%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tarjetaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  tarjetaDescripcion: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  infoContenedor: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  infoTexto: {
    fontSize: 14,
    color: "#777",
  },
});

export default PantallaPrincipal;
