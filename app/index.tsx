// npx expo start --tunnel 
// npx expo start --dev-client
// npx expo start --dev-client --tunnel -c

import { Text, View, Button, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable, StyleSheet,ScrollView,Alert,Linking} from "react-native";
import { styles } from './themeStyles';
import React from 'react'; 
import * as Location from "expo-location";
import {MaterialCommunityIcons} from '@expo/vector-icons';
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
import Svg, { Circle } from "react-native-svg"; //IVAN
import { auth,db } from '../firebase/firebase.js';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc,} from "firebase/firestore";
import { FirebaseError } from 'firebase/app';
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
export default function Index() {
   const [screen, setScreen] = useState("home");
   const [racha, setRacha] = useState(0);
   const [nombre, setNombre] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("")
   const [mensaje, setMensaje] = useState("")
   const [confirmpassword, setconfirmPassword] = useState("")
   const [presionFiltrada, setPresionFiltrada] = useState(0);//IVAN
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
        setRacha(data.rachaActual || 0);
        loadRecordatorios(user);
      }
    } else {
      setScreen("home");
    }
  });
  return unsubscribe;
}, []);
const finalizarTerapia = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, "usuarios", user.uid);
    const snap = await getDoc(ref);

    const ahora = new Date();
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

    const ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);
    const ayer = `${ayerDate.getFullYear()}-${String(ayerDate.getMonth() + 1).padStart(2, '0')}-${String(ayerDate.getDate()).padStart(2, '0')}`;

    let nuevaRacha = 0;
    let recordRacha = 0;
    let ultimouso = "";

    if (!snap.exists()) {
      nuevaRacha = 1;
      recordRacha = 1;
    } else {
      const data = snap.data();
      nuevaRacha = data.rachaActual || 0;
      recordRacha = data.recordRacha || 0;
      ultimouso = data.ultimoUso || "";

      if (ultimouso === hoy) {
        alert("Ya registraste tu terapia el día de hoy.");
        return;
      }

      if (ultimouso === ayer) {
        nuevaRacha += 1;
      } else {
        nuevaRacha = 1;
      }
    }

    if (nuevaRacha > recordRacha) recordRacha = nuevaRacha;
    await setDoc(ref, {
      rachaActual: nuevaRacha,
      recordRacha: recordRacha,
      ultimoUso: hoy
    }, { merge: true });

    setRacha(nuevaRacha); 
    alert(`¡Terapia finalizada! Racha actual: ${nuevaRacha}`);

  } catch (error) {
    console.log("Error en finalizarTerapia:", error);
  }
};
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
  
useEffect(() => { //ESP32 IVAN
  const interval = setInterval(async () => {

    try {

      const response = await fetch("http://192.168.0.8/presion");
      const texto = await response.text();
      console.log(texto);
      setPresionFiltrada(Number(texto));
    } catch (error) {
      console.log("ESP32 no conectado", error);
    }
  }, 500);
  return () => clearInterval(interval);
}, []);
  
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

const enviarMensajeEmergencia = async () => {

  if (!telefonoEmergencia) {
    Alert.alert(
      "Error",
      "No hay teléfono de emergencia registrado"
    );
    return;
  }

  const { status } =
    await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Permiso denegado",
      "No se pudo acceder a la ubicación"
    );
    return;
  }

  const location =
    await Location.getCurrentPositionAsync({});

  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  const mapsLink =
    `https://maps.google.com/?q=${latitude},${longitude}`;

  const numero = "52" + telefonoEmergencia;

  const mensaje =
    ` EMERGENCIA 

Necesito ayuda inmediata.
Esto es un mensaje desde mi app MediTrack.

Mi ubicación:
${mapsLink}`;

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      "Error",
      "WhatsApp no está instalado"
    );
  }
};
const PressureGauge = ({ pressure = 0 }) => { //IVAN
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(pressure, 300));
  const percent = clamped / 300;
  const strokeDashoffset = circumference * (1 - percent);
  return (
    <View style={{ alignItems: "center", marginTop: 20 }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e6e6e6"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2e86ff"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={{ position: "absolute", top: 55, alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "bold" }}>
          {Math.round(clamped)}
        </Text>
        <Text>mmHg</Text>
      </View>
    </View>
  );
};
  
return (
  <KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
  <View
    style={styles.pantallaprincipal}>
    {screen === "home" && (
    <>
<Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("register")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
      Crear cuenta
    </Text>
  </Pressable>

<Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("login")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
      Iniciar sesión
    </Text>
  </Pressable>
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
    <View style={styles.tarjetaRacha}>
      <MaterialCommunityIcons name="fire" size={35} color={racha > 0 ? "#ff5722" : "#A1A1A1" } />
      <View style={{ marginLeft: 15 }}>
          <Text style={styles.textoRachaValores}>{racha} días seguidos</Text>
          <Text style={styles.textoRachaSubtitulo}> {racha > 0 ? "Ya eres todo un experto" : "Comienza tu racha hoy"}  </Text>
        </View>
    </View>
    

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("dashboard")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
        Entrar
      </Text>
    </Pressable>
    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("login")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
        Cambiar de cuenta
      </Text>
    </Pressable>
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

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("handleRegister")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
        Registrarse
      </Text>
    </Pressable>

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={() => setScreen("home")}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
        Regresar
      </Text>
    </Pressable>

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

    <Pressable
      style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
    </Pressable>

    <Pressable
      style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
    </Pressable>

    <Text style={{ marginTop: 15 }}>
      {mensaje}
    </Text>

  </View>
)}
{screen === "dashboard" && (
  <ScrollView
  style={{flex: 1}}
  contentContainerStyle={{ alignItems: "center", paddingTop: 60, paddingBottom: 40 }}>
  <Text
      style={{
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30
      }}>
        Bipedestador
      </Text>
    <TouchableOpacity
    onPress={enviarMensajeEmergencia}
    style={{
      position: "absolute",
      bottom: 30,
      right: 20,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "red",
      justifyContent: "center",
      alignItems: "center",
      elevation: 5
    }}
  >
    <Text
      style={{
        color: "white",
        fontWeight: "bold",
        fontSize: 16
      }}
    >
      SOS
    </Text>
  </TouchableOpacity>
  <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

  <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

  <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

  <Pressable
   style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

  <Pressable
      style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
      onPress={finalizarTerapia}
    >
      <Text style={styles.btnCrearCuentaText}>
        Finalizar terapia del día
      </Text>
    </Pressable>

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>
  </ScrollView>

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
    <Pressable
  style={({pressed}) => [
        styles.btnCrearCuenta,
        pressed && styles.btnCrearCuentaPressed
      ]}
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
    </Pressable>
    <Pressable
     style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
      onPress={() => setScreen("dashboard")}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Volver
      </Text>
    </Pressable>
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

<Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>
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
  <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
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
  </Pressable>

  <Pressable
  style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
  onPress={() => setScreen("dashboard")}
>
  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
    Volver 
  </Text>
</Pressable>
  <Text style={{ marginTop: 10 }}>
  {mensaje}
</Text>
    </View>
)}

{screen === "Presion" && ( //IVAN
<View style={{ flex: 1, alignItems: "center", paddingTop: 20 }}>
  
  <PressureGauge pressure={presionFiltrada || 0} />

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#494b49",
      padding: 15,
      borderRadius: 12,
      marginTop: 20,
      alignItems: "center"
    }}
    onPress={async () => {
      try {
        await fetch("http://192.168.0.8/servo?angulo=0");
      } catch (e) {
        console.log(e);
      }
    }}
  >
    <Text style={{ color: "white", fontWeight: "bold" }}>
      Mover a 0°
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#494b49",
      padding: 15,
      borderRadius: 12,
      marginTop: 10,
      alignItems: "center"
    }}
    onPress={async () => {
      try {
        await fetch("http://192.168.0.8/servo?angulo=35");
      } catch (e) {
        console.log(e);
      }
    }}
  >
    <Text style={{ color: "white", fontWeight: "bold" }}>
      Mover a 35°
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#494b49",
      padding: 15,
      borderRadius: 12,
      marginTop: 10,
      alignItems: "center"
    }}
    onPress={async () => {
      try {
        await fetch("http://192.168.0.8/servo?angulo=70");
      } catch (e) {
        console.log(e);
      }
    }}
  >
    <Text style={{ color: "white", fontWeight: "bold" }}>
      Mover a 70°
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
  style={{
    width: "90%",
    backgroundColor: "#bdc9da",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center"
  }}
  onPress={async () => {
    try {
      await fetch("http://192.168.0.8/manual");
    } catch (e) {
      console.log(e);
    }
  }}
>
  <Text style={{ color: "white", fontWeight: "bold" }}>
    Aplicación
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={{
    width: "90%",
    backgroundColor: "#bdc9da",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center"
  }}
  onPress={async () => {
    try {
      await fetch("http://192.168.0.8/auto");
    } catch (e) {
      console.log(e);
    }
  }}
>
  <Text style={{ color: "white", fontWeight: "bold" }}>
    Controlador
  </Text>
</TouchableOpacity>

  <TouchableOpacity
    style={{
      width: "90%",
      backgroundColor: "#d9d9d9",
      padding: 18,
      borderRadius: 15,
      marginTop: 30,
      alignItems: "center"
    }}
    onPress={() => setScreen("dashboard")}
  >
    <Text style={{ fontSize: 18, fontWeight: "bold" }}>
      Volver
    </Text>
  </TouchableOpacity>

</View>
)}
  </View>
 </KeyboardAvoidingView>
);
}