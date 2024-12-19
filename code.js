const serverUrl = "https://opendata.aemet.es/opendata";
const apikey =
  "?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsYXVyYXZhbGVuY2lhMjZAZ21haWwuY29tIiwianRpIjoiMWVjZmJiNDctMTE2MC00YjQ3LWFkYTEtODg3YTY2ZjU1ZDgwIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3MzQzNTk3MTEsInVzZXJJZCI6IjFlY2ZiYjQ3LTExNjAtNGI0Ny1hZGExLTg4N2E2NmY1NWQ4MCIsInJvbGUiOiIifQ.OmBeRGAG5Pl0dbvx7OKseqUr9AqplYcvquZfTxqnYF0";

const inicio = () => {
  let ciudad = document.getElementById("ciudad");
  ciudad.addEventListener("blur", clima);
};

async function clima() {
  let municipio = String(document.getElementById("ciudad").value);

  let codigoMunicipio = await cargarMunicipios(municipio); // Aquí se usa await

  try {
    // Primera petición para obtener la URL de los datos
    const response = await fetch(
      `${serverUrl}/api/prediccion/especifica/municipio/diaria/${codigoMunicipio.codigo}${apikey}`,
      {
        method: "GET",
        mode: "cors",
        headers: { "cache-control": "no-cache" },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const datosUrl = data.datos; // URL de los datos
    if (!datosUrl) throw new Error("No se encontró la URL de los datos");

    // Segunda petición a la URL proporcionada para obtener los datos reales
    const datosResponse = await fetch(datosUrl);
    if (!datosResponse.ok) {
      throw new Error(`HTTP error! status: ${datosResponse.status}`);
    }

    const datosClima = await datosResponse.json();
    console.log("Datos del clima:", datosClima);

    // Actualiza la interfaz con la información
    actualizarUI(datosClima, codigoMunicipio.nombre);
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
  }
}

async function cargarMunicipios(municipio) {
  try {
    const response = await fetch("cod_municipios/municipios.json"); // Ruta al archivo JSON
    const municipios = await response.json();

    // Normalizar la entrada del usuario
    const municipioNormalizado = municipio
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Normalizar las claves del JSON y buscar coincidencias
    for (let key in municipios) {
      const keyNormalizada = key
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (keyNormalizada === municipioNormalizado) {
        return { codigo: municipios[key], nombre: key }; //devuelve el codigo y el nombre correcto
      }
    }

    console.log("Municipio no encontrado");
  } catch (error) {
    console.error("Error al cargar el archivo JSON:", error);
  }
}

function actualizarUI(datosClima, municipio) {
  // Acceso a los datos de la prediccion
  const prediccion = datosClima[0].prediccion.dia[0];
  const temperaturaMin = prediccion.temperatura.minima;
  const temperaturaMax = prediccion.temperatura.maxima;
  const sensacion = prediccion.sensTermica.maxima;
  const datosPorFranja = obtenerTiempoActual(
    prediccion.viento,
    prediccion.estadoCielo,
    prediccion.temperatura.dato,
    prediccion.probPrecipitacion
  );
  console.log(
    "Probabilidad de precipitación:",
    datosPorFranja.probabilidadPrecipitacion
  );
  let caja1 = document.getElementById("caja1");
  caja1.setAttribute("style", "display: inline-block");
  let caja3 = document.getElementById("caja3");
  caja3.setAttribute("style", "display: inline-block");

  console.log("Viento:", datosPorFranja.viento);
  console.log("Estado del cielo:", datosPorFranja.estadoCielo.descripcion);
  console.log("Temperatura:", datosPorFranja.temperatura);
  /*   {
    probabilidadPrecipitacion: probabilidadPrecipitacion.value,
    periodoPrecipitacion: probabilidadPrecipitacion.periodo,
    viento: vientoActual,
    estadoCielo: estadoCieloActual,
    temperatura: temperaturaActual.value,
    horaTemperatura: temperaturaActual.hora,
  }; */

  // Obtener el estado del cielo adecuado
  const estadoCielo = datosPorFranja.estadoCielo;
  console.log("Estado del cielo seleccionado:", estadoCielo);

  document.getElementById(
    "temperatura-valor"
  ).innerText = `Min: ${temperaturaMin}°C | Max: ${temperaturaMax}°C`;
  document.getElementById("ubicacion").textContent = municipio;
  document.getElementById(
    "temperatura-descripcion"
  ).textContent = `Sensación térmica: ${sensacion}°C`;
  document.getElementById(
    "temp-actual"
  ).textContent = `Temperatura actual: ${datosPorFranja.temperatura}°C`;

  let viento = document.getElementById("viento-velocidad");
  viento.textContent = datosPorFranja.viento.velocidad + "km/h";

  let cielo = document.getElementById("cielo");
  let iconoAnimado = document.getElementById("icono-animado");
  if (!iconoAnimado) {
    //asegurarse de que el icono no este ya creado
    iconoAnimado = document.createElement("img");
    iconoAnimado.id = "icono-animado";
    document.getElementById("caja2").insertBefore(iconoAnimado, cielo);
  }
  //preparar iconos
  switch (estadoCielo.descripcion) {
    case "Tormenta":
      iconoAnimado.src = "iconos/animated/thunder.svg";
      cielo.textContent = "Tormenta";
      console.log("TORMENTA");
      break;
    case "Lluvioso":
      iconoAnimado.src = "iconos/animated/rainy-2.svg";
      console.log("Lluvioso");
      break;
    case "Lluvia":
      iconoAnimado.src = "iconos/animated/rainy-7.svg";
      console.log("LLUVIA");
      break;
    case "Nieve":
      iconoAnimado.src = "iconos/animated/snowy-6.svg";
      console.log("NIEVE");
      break;
    case "Despejado":
      iconoAnimado.src = "iconos/animated/day.svg";
      cielo.textContent = "Despejado";
      console.log("Despejado");
      break;
    case "Poco nuboso":
      iconoAnimado.src = "iconos/animated/cloudy-day-1.svg";
      cielo.textContent = "Poco nuboso";
      console.log("Poco nuboso");
      break;
    case "Nubes altas":
      iconoAnimado.src = "iconos/animated/cloudy-day-2.svg";
      cielo.textContent = "Nubes altas";
      console.log("Nubes altas");
      break;

    case "Nuboso":
      iconoAnimado.src = "iconos/animated/cloudy-day-3.svg";
      cielo.textContent = "Nuboso";
      console.log("Nuboso");
      break;

    case "Muy nuboso":
      iconoAnimado.src = "iconos/animated/cloudy.svg";
      cielo.textContent = "Muy nuboso";
      console.log("Muy nuboso");
      break;
    default:
      iconoAnimado.src = "iconos/animated/day.svg";
      cielo.textContent = "Despejado";
      console.log("por defecto");
  }
}

function obtenerTiempoActual(viento, cielo, temperatura, probPrecipitacion) {
  const horaActual = new Date().getHours();

  // Función para obtener el valor correspondiente a una franja horaria
  function obtenerValorPorFranja(array, periodo) {
    return (
      array.find((item) => item.periodo === periodo) || {
        value: 0,
        periodo: "00-24",
      }
    );
  }

  // Determinar el periodo actual
  const periodoActual =
    horaActual < 6
      ? "00-06"
      : horaActual < 12
      ? "06-12"
      : horaActual < 18
      ? "12-18"
      : "18-24";

  // Obtener los valores de precipitación, viento y cielo según el periodo
  const probabilidadPrecipitacion = obtenerValorPorFranja(
    probPrecipitacion,
    periodoActual
  ).value;
  const vientoActual = obtenerValorPorFranja(viento, periodoActual);
  const estadoCieloActual = obtenerValorPorFranja(cielo, periodoActual);

  // Obtener la temperatura más cercana a la hora actual
  let temperaturaActual = { value: 0, hora: 0 };
  for (let i = 0; i < temperatura.length; i++) {
    if (
      i === 0 ||
      Math.abs(temperatura[i].hora - horaActual) <
        Math.abs(temperaturaActual.hora - horaActual)
    ) {
      temperaturaActual = temperatura[i];
    }
  }

  // Devolver un objeto con toda la información
  return {
    probabilidadPrecipitacion,
    periodoPrecipitacion: periodoActual,
    viento: vientoActual,
    estadoCielo: estadoCieloActual,
    temperatura: temperaturaActual.value,
    horaTemperatura: temperaturaActual.hora,
  };
}

window.addEventListener("DOMContentLoaded", inicio);
