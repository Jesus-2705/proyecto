// npx expo start --tunnel 
// npx expo start --dev-client
// npx expo start --dev-client --tunnel -c
// jesussagarnaga2705@gmail.com
// Dragonnegro123
import { Text, View, Button, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform} from "react-native";
import * as Notifications from "expo-notifications";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  })
});
import { auth,db } from '../firebase/firebase.js';
import { doc, getDoc, setDoc, collection, addDoc,} from "firebase/firestore";
import { FirebaseError } from 'firebase/app';
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
export default function Index() {
   const [screen, setScreen] = useState("home");
   const [nombre, setNombre] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("")
   const [mensaje, setMensaje] = useState("")
   const [confirmpassword, setconfirmPassword] = useState("")
   const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [tipoSangre, setTipoSangre] = useState("");
  const [telefonoEmergencia, setTelefonoEmergencia] = useState("");
  const [hora1, setHora1] = useState("");
  const [hora2, setHora2] = useState("");
  const [hora3, setHora3] = useState("");
  const loadRecordatorios = async (user: User) => {
  const ref = doc(db, "usuarios", user.uid, "config", "recordatorios");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    setHora1(data.hora1 || "");
    setHora2(data.hora2 || "");
    setHora3(data.hora3 || "");
  }
};
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setScreen("welcome");
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setNombre(data.nombre || "");
        setApellido(data.apellido || "");
        setFechaNacimiento(data.fechaNacimiento || "");
        setTipoSangre(data.tipoSangre || "");
        setTelefonoEmergencia(data.telefonoEmergencia || "");
        loadRecordatorios(user);
      }
    } else {
      setScreen("home");
    }
  });
  return unsubscribe;
}, []);
useEffect(() => {
  const initPermissions = async () => {
    await Notifications.requestPermissionsAsync();
  };

  initPermissions();

  const interval = setInterval(() => {
    const ahora = new Date();

    const horaActual =
      String(ahora.getHours()).padStart(2, "0") +
      ":" +
      String(ahora.getMinutes()).padStart(2, "0");

    const recordatorios = [hora1, hora2, hora3].filter(Boolean);

    recordatorios.forEach((hora) => {
      if (horaActual === hora) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Bipedestador",
            body: "Es hora de levantarte",
          },
          trigger: null,
        });
      }
    });
  }, 60000);
  return () => clearInterval(interval);
}, [hora1, hora2, hora3]);
const handleRegister = async () => {
  setMensaje("");
  if (password !== confirmpassword) {
    setMensaje("Las contraseñas no coinciden");
    return;
  }
  if (!email || !password || !nombre) {
    setMensaje("Completa todos los campos");
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Usuario creado:", userCredential.user.email);
    setMensaje("Cuenta creada correctamente ");
    // limpiar campos
    setNombre("");
    setEmail("");
    setPassword("");
    setconfirmPassword("");
    // regresar al inicio 
    setTimeout(() => {
  setMensaje("");
}, 2000);
  } catch (error) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      setMensaje("Ese correo ya está registrado");
    
    }
    else if (error.code === "auth/weak-password") {
      setMensaje("La contraseña debe tener al menos 6 caracteres");
    }
    else if (error.code === "auth/invalid-email") {
      setMensaje("Correo inválido");
    }
    else {
      setMensaje("Error: " + error.message);
    }
  } else {
    setMensaje("Error desconocido");
  }
}
};
const handleLogin = async () => {

    setMensaje("");
  if (!email || !password) {
    setMensaje("Completa todos los campos");
    return;
  }
  try {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  console.log("Sesión iniciada:", userCredential.user.email);
  setMensaje("Mi loco dele pa dentro");
  setTimeout(() => {
  setMensaje("");
}, 1500);
  } catch (error) {

    if (error instanceof FirebaseError) {
      if (error.code === "auth/invalid-credential") {
        setMensaje("Correo o contraseña incorrectos");
      }
      else if (error.code === "auth/invalid-email") {
        setMensaje("Correo inválido");
      }
      else {
        setMensaje("Error: " + error.message);
      }
    } else {
      setMensaje("Error desconocido");
    }
  }
};
const handleCambiarCuenta = async () => {
  await signOut(auth);
  setScreen("home");
}
const handleGuardarDatos = async () => {
  setMensaje("");

  if (!apellido || !fechaNacimiento || !tipoSangre || !telefonoEmergencia) {
    setMensaje("Es necesario que completes todos los datos");
    return;
  }

  if (telefonoEmergencia.length < 10) {
    setMensaje("Número de emergencia inválido");
    return;
  }

  try {

    const user = auth.currentUser;
    if (!user) {
      setMensaje("No hay sesión iniciada");
      return;
    }
    await setDoc(doc(db, "usuarios", user.uid), {
      nombre: nombre,
      apellido: apellido,
      fechaNacimiento: fechaNacimiento,
      tipoSangre: tipoSangre,
      telefonoEmergencia: telefonoEmergencia,
      email: user.email
    });

    setMensaje("Datos guardados correctamente");

    setTimeout(() => {
      setMensaje("");
      setScreen("dashboard");
    }, 1500);

  } catch (error) {
    setMensaje("Error al guardar datos");
    console.log(error);
  }
};
const GuardarRecordatorios = async () => {
  const user = auth.currentUser;
  if (!user) return;
  if (!hora1 || !hora2 || !hora3) {
    setMensaje("Completa las 3 horas");
    return;
  }
  const ref = doc(db, "usuarios", user.uid, "config", "recordatorios");
  await setDoc(ref, {
    hora1,
    hora2,
    hora3
  });
  setMensaje("Horarios guardados");
  setTimeout(() => {
    setScreen("dashboard");
  }, 1000);
};
return (
  <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
  <View
    style={{
      flex: 1,
      justifyContent: "center",
       alignItems: "center",
     }}
    >
{screen === "home" && (
    <>
<TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("register")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Crear cuenta
    </Text>
  </TouchableOpacity>

<TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("login")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Iniciar sesión
    </Text>
  </TouchableOpacity>
     </>
      )}
{screen === "welcome" && (
  <>
    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 20
      }}
    >
      Bienvenido
    </Text>
    <Text
      style={{
        fontSize: 22,
        marginBottom: 40
      }}
    >
      {nombre} {apellido}
    </Text>  
    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 25,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: "center"
      }}
      onPress={() => setScreen("dashboard")}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold"
        }}
      >
        Entrar
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 25,
        borderRadius: 15,
        alignItems: "center"
      }}
      onPress={handleCambiarCuenta}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold"
        }}
      >
        Cambiar de cuenta
      </Text>
    </TouchableOpacity>
  </>
)}
{screen === "register" && (
  <View style={{ width: "100%", alignItems: "center", padding: 20 }}>
    
    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30
      }}
    >
      Crear cuenta
    </Text>

    <TextInput
      placeholder="Nombre"
      placeholderTextColor="gray"
      value={nombre}
      onChangeText={setNombre}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
        backgroundColor: "white"
      }}
    />

    <TextInput
      placeholder="Correo"
      placeholderTextColor="gray"
      value={email}
      onChangeText={setEmail}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
        backgroundColor: "white"
      }}
    />

    <TextInput
      placeholder="Contraseña"
      placeholderTextColor="gray"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={true}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
        backgroundColor: "white"
      }}
    />

    <TextInput
      placeholder="Confirmar contraseña"
      placeholderTextColor="gray"
      value={confirmpassword}
      onChangeText={setconfirmPassword}
      secureTextEntry={true}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
        backgroundColor: "white"
      }}
    />

    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 25,
        borderRadius: 15,
        marginTop: 20,
        alignItems: "center"
      }}
      onPress={handleRegister}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold"
        }}
      >
        Registrarse
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 20,
        borderRadius: 15,
        marginTop: 15,
        alignItems: "center"
      }}
      onPress={() => setScreen("home")}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold"
        }}
      >
        Regresar
      </Text>
    </TouchableOpacity>

    <Text style={{ marginTop: 15 }}>
      {mensaje}
    </Text>

  </View>
)}
{screen === "login" && (
  <View style={{ width: "100%", alignItems: "center", padding: 20 }}>

    <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30
      }}
    >
      Iniciar sesión
    </Text>

    <TextInput
      placeholder="Correo"
      placeholderTextColor="gray"
      value={email}
      onChangeText={setEmail}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
       backgroundColor: "white"
      }}
    />

    <TextInput
      placeholder="Contraseña"
      placeholderTextColor="gray"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={true}
      style={{
        borderWidth: 1,
        width: "90%",
        marginTop: 10,
        padding: 15,
        borderRadius: 10,
        color: "black",
       backgroundColor: "white"
      }}
    />

    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 25,
        borderRadius: 15,
        marginTop: 20,
        alignItems: "center"
      }}
      onPress={handleLogin}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold"
        }}
      >
        Entrar
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 20,
        borderRadius: 15,
        marginTop: 15,
        alignItems: "center"
      }}
      onPress={() => setScreen("home")}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold"
        }}
      >
        Regresar
      </Text>
    </TouchableOpacity>

    <Text style={{ marginTop: 15 }}>
      {mensaje}
    </Text>

  </View>
)}
{screen === "dashboard" && (
  <>
  <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30
      }}>
        Bipedestador
      </Text>
  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("VerDatos")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Ver datos generales
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("EditarDatos")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Editar datos generales
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("Recordatorios")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Recordatorios
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("Presion")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Presión arterial
    </Text>
  </TouchableOpacity>

    <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("welcome")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Volver
    </Text>
  </TouchableOpacity>
  </>

)}
{screen === "EditarDatos" && (
   <View
    style={{
      flex: 1,
      alignItems: "center",
      paddingTop: 20
    }}
    >
   <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30
      }}>
        Se necesitan más datos para continuar
      </Text> 
    <TextInput
      placeholder="nombre"
      placeholderTextColor="gray"
      value={nombre}
      onChangeText={setNombre}
      style={{
      borderWidth: 1,
      width: "100%",
      marginTop: 10,
      padding: 8,
     color: "black",
     backgroundColor: "white"
      }}
      />
    <TextInput
    placeholder="Apellido"
    placeholderTextColor="gray"
    value={apellido}
    onChangeText={setApellido}
    style={{
      borderWidth: 1,
      width: "100%",
      marginTop: 10,
      padding: 8,
     color: "black",
     backgroundColor: "white"
    }}
    />
    <TextInput
      placeholder="DD/MM/AAAA"
      placeholderTextColor="gray"
      value={fechaNacimiento}
      onChangeText={(texto) => {
        let limpio = texto.replace(/\D/g, "");

        if (limpio.length <= 2) {
          setFechaNacimiento(limpio);
        }
        else if (limpio.length <= 4) {
          setFechaNacimiento(
            limpio.slice(0, 2) + "/" + limpio.slice(2)
          );
        }
        else {
          setFechaNacimiento(
            limpio.slice(0, 2) +
            "/" +
            limpio.slice(2, 4) +
            "/" +
            limpio.slice(4, 8)
          );
        }
      }}
      keyboardType="numeric"
      style={{
        borderWidth: 1,
        width: "100%",
        marginTop: 10,
        padding: 8,
        color: "black",
        backgroundColor: "white"
      }}
    />
    <TextInput
    placeholder="Tipo de sangre"
    placeholderTextColor="gray"
    value={tipoSangre}
    onChangeText={setTipoSangre}
    style={{
      borderWidth: 1,
      width: "100%",
      marginTop: 10,
      padding: 8,
      color: "black",
      backgroundColor: "white"
    }}
    />
    <TextInput
    placeholder="Teléfono de emergencia"
    placeholderTextColor="gray"
    value={telefonoEmergencia}
    onChangeText={setTelefonoEmergencia}
    keyboardType="numeric"
    style={{
      borderWidth: 1,
      width: "100%",
      marginTop: 10,
      padding: 8,
      color: "black",
      backgroundColor: "white"
    }}
    />
    <TouchableOpacity
  style={{
    width: "90%",
    backgroundColor: "#d9d9d9",
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
    marginTop: 20
  }}
  onPress={handleGuardarDatos}
>
  <Text
    style={{
      fontSize: 20,
      fontWeight: "bold"
    }}
  >
    Guardar datos
  </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 18,
        borderRadius: 15,
        marginTop: 20,
        alignItems: "center"
      }}
      onPress={() => setScreen("dashboard")}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Volver
      </Text>
    </TouchableOpacity>
    <Text style={{ marginTop: 10 }}>
  {mensaje}
</Text>

</View>
)}
{screen === "VerDatos" && (
  <>
    <Text>Datos generales</Text>

    <Text>Nombre: {nombre}</Text>
    <Text>Apellido: {apellido}</Text>
    <Text>Fecha: {fechaNacimiento}</Text>
    <Text>Tipo de sangre: {tipoSangre}</Text>
    <Text>Emergencia: {telefonoEmergencia}</Text>

<TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("EditarDatos")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Editar datos
    </Text>
  </TouchableOpacity>

    <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={() => setScreen("dashboard")}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Volver
    </Text>
  </TouchableOpacity>
  </>
)}
{screen === "Recordatorios" && (
    <View  style={{ flex: 1, alignItems: "center", padding: 20 }}>
    <Text style={{ fontSize: 22, fontWeight: "bold" }}>
      Recordatorios de levantamiento, horas en formato 24 horas
    </Text>
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 1"
      value={hora1}
      onChangeText={setHora1}
      style={{ borderWidth: 1, width: "100%", marginTop: 10, padding: 8, color: "black", backgroundColor:"white"}}
    />
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 2"
      value={hora2}
      onChangeText={setHora2}
      style={{ borderWidth: 1, width: "100%", marginTop: 10, padding: 8,  color: "black", backgroundColor:"white" }}
    />
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 3"
      value={hora3}
      onChangeText={setHora3}
      style={{ borderWidth: 1, width: "100%", marginTop: 10, padding: 8,  color: "black", backgroundColor:"white"}}
    /> 
  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 25,
      borderRadius: 15,
      marginBottom: 20,
      alignItems: "center"
    }}
    onPress={GuardarRecordatorios}
  >
    <Text
      style={{
        fontSize: 20,
        fontWeight: "bold"
      }}
    >
      Guardar recordatorios
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
  style={{
    width: "90%",
    backgroundColor: "#d9d9d9",
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    alignItems: "center"
  }}
  onPress={() => setScreen("dashboard")}
>
  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
    Volver 
  </Text>
</TouchableOpacity>
  <Text style={{ marginTop: 10 }}>
  {mensaje}
</Text>
    </View>
)}
{screen === "Presion" && (
      <TouchableOpacity
      style={{
        width: "90%",
        backgroundColor: "#d9d9d9",
        padding: 18,
        borderRadius: 15,
        marginTop: 20,
        alignItems: "center"
      }}
      onPress={() => setScreen("dashboard")}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Volver
      </Text>
    </TouchableOpacity>
)}
  </View>
 </KeyboardAvoidingView>
);
}
