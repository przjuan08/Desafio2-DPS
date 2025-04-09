import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

// Importamos nuestros componentes principales
import PantallaPrincipal from "./screens/PantallaPrincipal";
import PantallaCaptura from "./screens/PantallaCaptura";
import PantallaRecuerdos from "./screens/PantallaRecuerdos";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            // Asignamos iconos según la pantalla
            if (route.name === "Inicio") {
              iconName = "home";
            } else if (route.name === "Capturar") {
              iconName = "camera";
            } else if (route.name === "Mis Recuerdos") {
              iconName = "photo-library";
            }

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#005581",
          tabBarInactiveTintColor: "#777",
          tabBarStyle: {
            paddingBottom: 5,
            height: 60,
          },
          headerStyle: {
            backgroundColor: "#005581",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Tab.Screen
          name="Inicio"
          component={PantallaPrincipal}
          options={{ title: "MemoriesApp" }}
        />
        <Tab.Screen
          name="Capturar"
          component={PantallaCaptura}
          options={{ title: "Capturar Momento" }}
        />
        <Tab.Screen
          name="Mis Recuerdos"
          component={PantallaRecuerdos}
          options={{ title: "Mis Recuerdos" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
