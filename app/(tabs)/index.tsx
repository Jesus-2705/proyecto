import { Text, View, Button } from "react-native";
export default function Index() {
  return (
    <View>
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    
      <Text>Bienviendo a MediTrack</Text>

      <Button title="Crear cuenta" onPress={() => {}} />
      <Button title="Iniciar sesión" onPress={() => {}} />
    </View>
  );
}