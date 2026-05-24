import { StyleSheet } from 'react-native';

const colores = {
    fondo: "#ffffff",
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
    backgroundColor: colores.botonHover, 
    transform: [{ scale: 0.98 }], 
},

btnCrearCuentaText: {
    fontSize: 20,
    fontWeight: "bold",
    },

tarjetaRacha: {
   flexDirection: 'row',
    backgroundColor: '#161F28', 
    width: '90%',
    padding: 20,
    borderRadius: 25, 
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#334155', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
textoRachaValores: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textoRachaSubtitulo: {
    color: '#8A99A8',
    fontSize: 14,
  },
  tituloBienvenida: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start', 
    marginLeft: '5%',
  },
  });