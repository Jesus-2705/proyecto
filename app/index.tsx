// npx expo start --tunnel 
// npx expo start --dev-client
// npx expo start --dev-client --tunnel -c

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit"; //IVNA
import Svg, { Circle } from "react-native-svg"; //IVAN
import { auth, db } from '../firebase/firebase.js';
import { styles } from './themeStyles';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  })
});
export default function Index() {
   const [screen, setScreen] = useState("home");
   const [racha, setRacha] = useState(0);
   const [nombre, setNombre] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("")
   const [mensaje, setMensaje] = useState("")
   const [confirmpassword, setconfirmPassword] = useState("")
   const [presionFiltrada, setPresionFiltrada] = useState(0);//IVAN
   const [presionAnterior, setPresionAnterior] = useState(0); //Ivan
   const [ultimoEvento, setUltimoEvento] =useState(0);//Ivan
   const [modalVisible, setModalVisible] = useState(false); //IVAN
   const presionAnteriorRef = useRef(0);
   const ultimoEventoRef = useRef(0);
    const [grado1, setGrado1] = useState("");
    const [tiempo1, setTiempo1] = useState("");
    const [grado2, setGrado2] = useState("");
    const [tiempo2, setTiempo2] = useState("");
    const [grado3, setGrado3] = useState("");
    const [tiempo3, setTiempo3] = useState("");
   const [apellido, setApellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [tipoSangre, setTipoSangre] = useState("");
  const [telefonoEmergencia, setTelefonoEmergencia] = useState("");
  const [hora1, setHora1] = useState("");
  const [hora2, setHora2] = useState("");
  const [hora3, setHora3] = useState("");
  const [historial, setHistorial] = useState<any[]>([]);//IVan
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
    alert(`Terapia finalizada! Racha actual: ${nuevaRacha}`);

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

  
useEffect(() => {

  const interval = setInterval(async () => {

    try {
      const response = await fetch("http://192.168.0.8/presion");
      const texto = await response.text();
      const valor = Number(texto);
      setPresionFiltrada(valor);
      const ahora = Date.now();
      if (
        valor >= 50 &&
        Math.abs(valor - presionAnteriorRef.current) > 20 &&
        ahora - ultimoEventoRef.current > 300000
      ) {
        guardarPresion("evento");
        ultimoEventoRef.current = ahora;
      }
      presionAnteriorRef.current = valor;
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
  try{
  await signOut(auth);
  setEmail("");
  setPassword("");
} catch (error) {
  console.log("Error al cerrar sesión:", error);
}
};
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

const guardarPresion = async (tipo = "manual") => { //IVAN

  if (presionFiltrada < 20) {
  return;
  }

  try {

    const user = auth.currentUser;

    if (!user) return;

    await addDoc(
      collection(
        db,
        "usuarios",
        user.uid,
        "presiones"
      ),
      {
        presion: Math.round(presionFiltrada),
        fecha: serverTimestamp(),
        tipo: tipo
      }
    );

    if(tipo === "manual"){
      Alert.alert(
        "Registro guardado",
        `${Math.round(presionFiltrada)} mmHg`
      );
    }

  } catch(error){
    console.log(error);
  }

};

const cargarHistorial = async () => {

  const user = auth.currentUser;

  if (!user) return;

  const q = query(
    collection(
      db,
      "usuarios",
      user.uid,
      "presiones"
    ),
    orderBy("fecha", "desc")
  );

  const snap = await getDocs(q);

  const datos: any[] = [];

  snap.forEach((doc) => {
    datos.push({
      id: doc.id,
      ...doc.data()
    });
  });

  setHistorial(datos);

};

const enviarMensajeEmergencia = async () => {
  if (!telefonoEmergencia) {
    Alert.alert("Error", "No hay teléfono de emergencia registrado");
    return;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    Alert.alert("Permiso denegado", "No se pudo obtener ubicación");
    return;
  }

  const location = await Location.getCurrentPositionAsync({});

  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;

  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

  const numero = "52" + telefonoEmergencia;

  const mensaje = `EMERGENCIA
Necesito ayuda inmediata.
App MediTrack

Ubicación:
${mapsLink}`;

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Error", "No se pudo abrir WhatsApp");
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

const datosGrafica = historial //NUrvo gtafica 
  .slice()
  .reverse()
  .map(item => item.presion);

const screenWidth = Dimensions.get("window").width;//IBNA
  
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
      styles.btnEntrar,
      pressed && styles.btnEntrarPressed]}
    onPress={() => setScreen("dashboard")}
  >
  
    <Ionicons 
    name="person-outline"     
    size={24}                 
    color="#253237"           
    style={styles.btnIcono}   
  />
    <Text
      style={styles.btnTexto}
    >
        Entrar
      </Text>
    </Pressable>

    <Pressable
    style={({pressed}) => [
      styles.btnCambiarCuenta,
      pressed && styles.btnCambiarCuentaPressed
    ]}
    onPress={handleCambiarCuenta}
  >
    <Ionicons 
    name="sync-outline"
    size={24}
    color="#253237"
    style={styles.btnIcono} />
    <Text
      style={styles.btnTexto}>
        Cambiar cuenta
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
    
    <View style={styles.inputContenedor}>
    <TextInput
      placeholder="Nombre"
      placeholderTextColor="gray"
      value={nombre}
      onChangeText={setNombre}
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
      <Ionicons
        name="mail-outline"
        size={22}
        color="#5C6B73"
        style={styles.inputIcono}
      />
    <TextInput
      placeholder="Correo"
      placeholderTextColor="gray"
      value={email}
      onChangeText={setEmail}
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
      <Ionicons
      name="key-outline"
      size={22}
      color="#5C6B73"
      style={styles.inputIcono}
    />
    <TextInput
      placeholder="Contraseña"
      placeholderTextColor="gray"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={true}
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
      <Ionicons
      name="key-outline"
      size={22}
      color="#5C6B73"
      style={styles.inputIcono}
    />
    <TextInput
      placeholder="Confirmar contraseña"
      placeholderTextColor="gray"
      value={confirmpassword}
      onChangeText={setconfirmPassword}
      secureTextEntry={true}
      style={styles.inputTexto}
    />
    </View>

    <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={handleRegister}
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
    <View style={styles.inputContenedor}>
    <Ionicons
      name="mail-outline"
      size={22}
      color="#5C6B73"
      style={styles.inputIcono}
    />
    <TextInput
      placeholder="Correo"
      placeholderTextColor="gray"
      value={email}
      onChangeText={setEmail}
      style={styles.inputTexto}
    />
  </View>

  <View style={styles.inputContenedor}>
      <Ionicons
      name="key-outline"
      size={22}
      color="#5C6B73"
      style={styles.inputIcono}
    />
    <TextInput
      placeholder="Contraseña"
      placeholderTextColor="gray"
      value={password}
      onChangeText={setPassword}
      secureTextEntry={true}
      style={styles.inputTexto}
    />
    </View>

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
  showsVerticalScrollIndicator={false}
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
    style={styles.btnemergencia}
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
  <Pressable //NUEVI POR SI LA CAGO
    style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={async () => {
      await cargarHistorial();
      setScreen("Historial");
    }}
  >
    <Text style={styles.btndashboardText}>
      Historial de presión
    </Text>
  </Pressable>
  <Pressable
    style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={() => setScreen("VerDatos")}
  >
    <Text
      style={styles.btndashboardText}
    >
      Datos generales
    </Text>
  </Pressable>

  <Pressable
    style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={() => setScreen("EditarDatos")}
  >
    <Text
      style={styles.btndashboardText}
    >
      Editar tus datos 
    </Text>
  </Pressable>

  <Pressable
    style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={() => setScreen("Recordatorios")}
  >
    <Text
      style={styles.btndashboardText}
    >
      Recordatorios
    </Text>
  </Pressable>

  <Pressable
   style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={() => setScreen("Presion")}
  >
    <Text
      style={styles.btndashboardText}
    >
      Presión arterial
    </Text>
  </Pressable>

  <Pressable
      style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
      onPress={finalizarTerapia}
    >
      <Text style={styles.btndashboardText}>
        Finalizar terapia 
      </Text>
    </Pressable>

    <Pressable
    style={({pressed}) => [
      styles.btndashboard,
      pressed && styles.btndashboardPressed
    ]}
    onPress={() => setScreen("welcome")}
  >
    <Text
      style={styles.btndashboardText}
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

    <View style={styles.inputContenedor}>
    <TextInput
      placeholder="nombre"
      placeholderTextColor="gray"
      value={nombre}
      onChangeText={setNombre}
      style={styles.inputTexto}
      />
    </View>

    <View style={styles.inputContenedor}>
    <TextInput
    placeholder="Apellido"
    placeholderTextColor="gray"
    value={apellido}
    onChangeText={setApellido}
    style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
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
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
    <TextInput
    placeholder="Tipo de sangre"
    placeholderTextColor="gray"
    value={tipoSangre}
    onChangeText={setTipoSangre}
    style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
    <TextInput
    placeholder="Teléfono de emergencia"
    placeholderTextColor="gray"
    value={telefonoEmergencia}
    onChangeText={setTelefonoEmergencia}
    keyboardType="numeric"
    style={styles.inputTexto}
    />
    </View>

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
    <View style={styles.tarjetaContenedor}>
    <Text style={styles.tarjetaTitulo}>Datos generales</Text>
    <View style={styles.lineaDivisoria} />
    <View style={styles.datoRenglon}>
    <Ionicons name="person-outline" size={20} color="#5C6B73" style={styles.datoIcono} />
    <Text style={styles.datoEtiqueta}>Nombre:</Text>
    <Text style={styles.datoValor}>{nombre} {apellido}</Text>
  </View>

  <View style={styles.datoRenglon}>
    <Ionicons name="calendar-outline" size={20} color="#5C6B73" style={styles.datoIcono} />
    <Text style={styles.datoEtiqueta}>Fecha:</Text>
    <Text style={styles.datoValor}>{fechaNacimiento}</Text>
  </View>

  <View style={styles.datoRenglon}>
    <Ionicons name="water-outline" size={20} color="#5C6B73" style={styles.datoIcono} />
    <Text style={styles.datoEtiqueta}>Tipo de sangre:</Text>
    <Text style={styles.datoValor}>{tipoSangre}</Text>
  </View>

  <View style={styles.datoRenglon}>
    <Ionicons name="alert-circle-outline" size={20} color="#5C6B73" style={styles.datoIcono} />
    <Text style={styles.datoEtiqueta}>Emergencia:</Text>
    <Text style={styles.datoValor}>{telefonoEmergencia}</Text>
  </View>
</View>

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
    <View style={styles.inputContenedor}>
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 1"
      value={hora1}
      onChangeText={setHora1}
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 2"
      value={hora2}
      onChangeText={setHora2}
      style={styles.inputTexto}
    />
    </View>

    <View style={styles.inputContenedor}>
    <TextInput
      placeholderTextColor="gray"
      placeholder="Hora 3"
      value={hora3}
      onChangeText={setHora3}
      style={styles.inputTexto}
    /> 
    </View>

  <Pressable
    style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
    onPress={GuardarRecordatorios}
  >
    <Text
      style={styles.btnCrearCuentaText}
    >
      Guardar 
    </Text>
  </Pressable>

  <Pressable
  style={({pressed}) => [
      styles.btnCrearCuenta,
      pressed && styles.btnCrearCuentaPressed
    ]}
  onPress={() => setScreen("dashboard")}
>
  <Text style={styles.btnCrearCuentaText}>
    Volver 
  </Text>
</Pressable>
  <Text style={{ marginTop: 10 }}>
  {mensaje}
</Text>
    </View>
)}

 {screen === "Presion" && (
  <ScrollView
    contentContainerStyle={{
      flexGrow: 1,
      alignItems: "center",
      paddingVertical: 25,
      backgroundColor: "#ECEBE4",
    }}
  >
    <View
      style={{
        backgroundColor: "#FFFFFF",
        width: "92%",
        borderRadius: 25,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 15,
          color: "#22333B",
        }}
      >
        Presión Actual
      </Text>
      <PressureGauge pressure={presionFiltrada || 0} />
      <TouchableOpacity
        style={{
          marginTop: 20,
          backgroundColor: "#48c023",
          width: "100%",
          padding: 15,
          borderRadius: 15,
          alignItems: "center",
        }}
        onPress={() => guardarPresion("manual")}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          Guardar medición
        </Text>
      </TouchableOpacity>
    </View>
    <View
      style={{
        width: "92%",
        marginTop: 20,
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 15,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 15,
          color: "#22333B",
          textAlign: "center",
        }}
      >
        Control de Ángulo
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            marginHorizontal: 4,
            backgroundColor: "#425196",
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={async () => {
            try {
              await fetch("http://192.168.0.8/servo?angulo=0");
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo conectar con el ESP32"
              );
              console.log(error);
            }
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            0°
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            marginHorizontal: 4,
            backgroundColor: "#425196",
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={async () => {
            try {
              await fetch("http://192.168.0.8/servo?angulo=35");
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo conectar con el ESP32"
              );
              console.log(error);
            }
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            35°
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            marginHorizontal: 4,
            backgroundColor: "#425196",
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={async () => {
            try {
              await fetch("http://192.168.0.8/servo?angulo=70");
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo conectar con el ESP32"
              );
              console.log(error);
            }
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            70°
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <View
      style={{
        width: "92%",
        marginTop: 20,
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 15,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 15,
          textAlign: "center",
          color: "#22333B",
        }}
      >
        Modo de Control
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            marginRight: 5,
            backgroundColor: "#d4626c",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={async () => {
          try {
            await fetch("http://192.168.0.8/auto");
          } catch (error) {
            Alert.alert(
              "Error",
              "No se pudo conectar con el ESP32"
            );
            console.log(error);
          }
        }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Aplicación
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            marginLeft: 5,
            backgroundColor: "#d4626c",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={async () => {
          try {

            await fetch("http://192.168.0.8/manual");

          } catch (error) {

            Alert.alert(
              "Error",
              "No se pudo conectar con el ESP32"
            );

            console.log(error);
          }
        }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Controlador
          </Text>
        </TouchableOpacity>
      </View>
    </View>

    <TouchableOpacity
      style={{
        marginTop: 20,
        backgroundColor: "#4989ac",
        width: "92%",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
      }}
      onPress={() => setScreen("Terapias")}
    >
      <Text
        style={{
          color: "white",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        Terapias
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={{
        marginTop: 12,
        backgroundColor: "#C6D4DF",
        width: "92%",
        padding: 15,
        borderRadius: 15,
        alignItems: "center",
      }}
      onPress={() => setScreen("dashboard")}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: "#22333B",
        }}
      >
        Volver
      </Text>
    </TouchableOpacity>
  </ScrollView>
)}

{screen === "Terapias" && (
  <View
    style={{
      flex: 1,
      backgroundColor: "#EEF2F7",
      alignItems: "center",
      paddingTop: 50,
      paddingHorizontal: 20
    }}
  >
    <Text
      style={{
        fontSize: 34,
        fontWeight: "bold",
        color: "#1E293B",
        marginBottom: 10
      }}
    >
      Terapias
    </Text>

    <Text
      style={{
        fontSize: 16,
        color: "#64748B",
        marginBottom: 30,
        textAlign: "center"
      }}
    >
      Inicie una sesión terapéutica para el paciente
    </Text>

    <View
      style={{
        width: "100%",
        backgroundColor: "white",
        borderRadius: 22,
        padding: 20,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 5
      }}
    >

      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: "#0F172A",
          marginBottom: 8
        }}
      >
        Sesión predeterminada
      </Text>

      <Text
        style={{
          color: "#64748B",
          marginBottom: 18
        }}
      >
        Rutina automática recomendada
      </Text>

      <View
        style={{
          backgroundColor: "#F8FAFC",
          borderRadius: 15,
          padding: 15,
          marginBottom: 20
        }}
      >
        <Text
          style={{
            marginBottom: 8,
            color: "#334155",
            fontSize: 15
          }}
        >
          • Posición 1 → 0° durante 3 segundos
        </Text>
        <Text
          style={{
            marginBottom: 8,
            color: "#334155",
            fontSize: 15
          }}
        >
          • Posición 2 → 30° durante 3 segundos
        </Text>
        <Text
          style={{
            color: "#334155",
            fontSize: 15
          }}
        >
          • Posición 3 → 60° durante 3 segundos
        </Text>
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: "#1E293B",
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center"
        }}
        onPress={async () => {
          try {
            await fetch("http://192.168.0.8/terapia1");
            Alert.alert(
              "Terapia",
              "Terapia predeterminada iniciada"
            );
          } catch (e) {
            console.log(e);
          }
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          Iniciar sesión
        </Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity
      style={{
        width: "100%",
        backgroundColor: "#0EA5E9",
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: "center",
        shadowColor: "#0EA5E9",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5
      }}
      onPress={() => setModalVisible(true)}
    >
      <Text
        style={{
          color: "white",
          fontSize: 17,
          fontWeight: "bold"
        }}
      >
        Terapia personalizada
      </Text>
    </TouchableOpacity>
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.55)"
        }}
      >
        <View
          style={{
            width: "92%",
            backgroundColor: "white",
            borderRadius: 25,
            padding: 22
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color: "#0F172A",
              textAlign: "center",
              marginBottom: 20
            }}
          >
            Sesión personalizada
          </Text>
          {[
            {
              titulo: "Posición 1",
              grado: grado1,
              setGrado: setGrado1,
              tiempo: tiempo1,
              setTiempo: setTiempo1
            },
            {
              titulo: "Posición 2",
              grado: grado2,
              setGrado: setGrado2,
              tiempo: tiempo2,
              setTiempo: setTiempo2
            },
            {
              titulo: "Posición 3",
              grado: grado3,
              setGrado: setGrado3,
              tiempo: tiempo3,
              setTiempo: setTiempo3
            }
          ].map((item, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: 18,
                padding: 15,
                marginBottom: 15
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 10,
                  color: "#1E293B"
                }}
              >
                {item.titulo}
              </Text>

              <TextInput
                placeholder="Grados (0-80)"
                keyboardType="numeric"
                value={item.grado}
                onChangeText={(text) =>
                  item.setGrado(
                    text.replace(/[^0-9]/g, "")
                  )
                }
                style={{
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10
                }}
              />
              <TextInput
                placeholder="Tiempo (seg)"
                keyboardType="numeric"
                value={item.tiempo}
                onChangeText={(text) =>
                  item.setTiempo(
                    text.replace(/[^0-9]/g, "")
                  )
                }
                style={{
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: 12,
                  padding: 14
                }}
              />
            </View>
          ))}
          <TouchableOpacity
            style={{
              backgroundColor: "#0F172A",
              paddingVertical: 17,
              borderRadius: 18,
              alignItems: "center",
              marginTop: 5
            }}
            onPress={async () => {

              if (!grado1 || !tiempo1 || !grado2 || !tiempo2 || !grado3 || !tiempo3)
               {
                Alert.alert(
                  "Error",
                  "Completa todos los campos");
                return;
              }
              const g1 = Number(grado1);
              const g2 = Number(grado2);
              const g3 = Number(grado3);
              const t1 = Number(tiempo1);
              const t2 = Number(tiempo2);
              const t3 = Number(tiempo3);
              if (g1 < 0 || g1 > 80 || g2 < 0 || g2 > 80 || g3 < 0 || g3 > 80) {
                Alert.alert(
                  "Error",
                  "Los grados deben estar entre 0 y 80");
                return;
              }

              if (t1 <= 0 ||t2 <= 0 ||t3 <= 0) {
                Alert.alert(
                  "Error",
                  "Los tiempos deben ser mayores a 0");
                return;
              }
              try {
                await fetch(
                  `http://192.168.0.8/terapiaPersonalizada?g1=${g1}&t1=${t1}&g2=${g2}&t2=${t2}&g3=${g3}&t3=${t3}`
                );
                Alert.alert(
                  "Terapia",
                  "Terapia iniciada"
                );
                setModalVisible(false);
              } catch (error) {
                Alert.alert(
                  "Error",
                  "No se pudo comunicar con el ESP32"
                );
              }
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 16
              }}
            >
              Iniciar terapia
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#E2E8F0",
              paddingVertical: 15,
              borderRadius: 18,
              alignItems: "center",
              marginTop: 12
            }}
            onPress={() => setModalVisible(false)}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: "#1E293B"
              }}
            >
              Cancelar
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>

    <TouchableOpacity
      style={{
        marginTop: 20,
        width: "100%",
        backgroundColor: "#CBD5E1",
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: "center"
      }}
      onPress={() => setScreen("Presion")}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "bold",
          color: "#1E293B"
        }}
      >
        Volver
      </Text>
    </TouchableOpacity>

  </View>
)}

{screen === "Historial" && (

<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{
    padding: 15,
    paddingBottom: 40,
    alignItems: "center"
  }}
  showsVerticalScrollIndicator={false}
>

  <Text
    style={{
      fontSize: 30,
      fontWeight: "bold",
      color: "#253237",
      marginBottom: 20
    }}
  >
    Historial
  </Text>

  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 20
    }}
  >
    <View
      style={{
        flex: 1,
        backgroundColor: "#3B82F6",
        borderRadius: 15,
        padding: 15,
        marginRight: 5,
        alignItems: "center"
      }}
    >
      <Text style={{ color: "white", fontSize: 12 }}>
        Muestras
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold"
        }}
      >
        {
          historial.length
            ? Math.round(
                historial.reduce((acc, item) => acc + item.presion,0
                ) / historial.length
              )
            : 0
        }
      </Text>
    </View>

    <View
      style={{
        flex: 1,
        backgroundColor: "#22C55E",
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 5,
        alignItems: "center"
      }}
    >
      <Text style={{ color: "white", fontSize: 12 }}>
        Máxima
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold"
        }}
      >
        {
          historial.length
            ? Math.max(...historial.map(x => x.presion))
            : 0
        }
      </Text>
    </View>

    <View
      style={{
        flex: 1,
        backgroundColor: "#EF4444",
        borderRadius: 15,
        padding: 15,
        marginLeft: 5,
        alignItems: "center"
      }}
    >
      <Text style={{ color: "white", fontSize: 12 }}>
        Mínima
      </Text>

      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold"
        }}
      >
        {
          historial.length
            ? Math.min(...historial.map(x => x.presion))
            : 0
        }
      </Text>
    </View>
  </View>

  <View
    style={{
      width: "100%",
      backgroundColor: "white",
      borderRadius: 20,
      padding: 15,
      marginBottom: 25,
      elevation: 4
    }}
  >
    <Text
      style={{
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10
      }}
    >
      Tendencia de presión
    </Text>

{historial.length === 0 ? (
  <Text style={{ textAlign: "center", marginVertical: 20 }}>
    No hay mediciones registradas aún
  </Text>
) : (
  <LineChart
    data={{
      labels: historial.slice(0, 8).reverse().map((_, i) => `${i + 1}`),
      datasets: [
        {
          data: historial
            .slice(0, 8)
            .reverse()
            .map(item => Number(item.presion))
        }
      ]
    }}
    width={320}
    height={220}
    fromZero={true}
    yAxisSuffix=""
    chartConfig={{
      backgroundGradientFrom: "#FFFFFF",
      backgroundGradientTo: "#FFFFFF",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59,130,246,${opacity})`,
      labelColor: () => "#555",
      propsForDots: { r: "5" }
    }}
    bezier
    style={{
      borderRadius: 15,
      alignSelf: "center"
    }}
  />
)}
  </View>

  <TouchableOpacity
    style={{
      width: "80%",
      backgroundColor: "#A6BBC8",
      padding: 15,
      borderRadius: 15,
      alignItems: "center",
      marginTop: 10
    }}
    onPress={() => setScreen("dashboard")}
  >
    
    <Text
      style={{
        fontWeight: "bold",
        fontSize: 18
      }}
    >
      Volver
    </Text>
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 15
    }}
  >
    Registros
  </Text>
  

  {historial.map((item) => (

    <View
      key={item.id}
      style={{
        width: "100%",
        backgroundColor: "white",
        borderRadius: 18,
        padding: 15,
        marginBottom: 12,
        elevation: 2
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#253237"
          }}
        >
          {item.presion} mmHg
        </Text>

        <View
          style={{
            backgroundColor:
              item.tipo === "manual"
                ? "#3B82F6"
                : "#F59E0B",

            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 12
            }}
          >
            {item.tipo}
          </Text>
        </View>
      </View>

      <Text
        style={{
          color: "#666",
          marginTop: 5
        }}
      >
        {item.fecha?.toDate
          ? item.fecha
              .toDate()
              .toLocaleString()
          : ""}
      </Text>
    </View>

  ))}
</ScrollView>
)}
  </View>
 </KeyboardAvoidingView>
);
}


