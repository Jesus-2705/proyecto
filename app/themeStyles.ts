import { StyleSheet } from 'react-native';

const colores = {
    fondo: "#0A0F14",
    boton: "#8fb3e2",
    botonHover: "#4073b6",
    textoBoton: "#ffffff",
};
export const styles = StyleSheet.create({
pantallaprincipal: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
},
btnCrearCuenta: {
    width: "90%",
    backgroundColor: colores.boton,
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
},
btnCrearCuentaPressed: {
    backgroundColor: colores.botonHover, // Color "Hover" (un gris más oscuro cuando se presiona)
    transform: [{ scale: 0.98 }], // Un mini efecto de hundimiento para que se sienta más real
},
// TEXTO: Dentro de Crear Cuenta
btnCrearCuentaText: {
    fontSize: 20,
    fontWeight: "bold",
    },
});