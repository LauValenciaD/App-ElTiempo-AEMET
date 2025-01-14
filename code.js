const serverUrl = "https://opendata.aemet.es/opendata";
const apikey =
  "?api_key=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsYXVyYXZhbGVuY2lhMjZAZ21haWwuY29tIiwianRpIjoiMWVjZmJiNDctMTE2MC00YjQ3LWFkYTEtODg3YTY2ZjU1ZDgwIiwiaXNzIjoiQUVNRVQiLCJpYXQiOjE3MzQzNTk3MTEsInVzZXJJZCI6IjFlY2ZiYjQ3LTExNjAtNGI0Ny1hZGExLTg4N2E2NmY1NWQ4MCIsInJvbGUiOiIifQ.OmBeRGAG5Pl0dbvx7OKseqUr9AqplYcvquZfTxqnYF0";

const inicio = () => {
  let ciudad = document.getElementById("ciudad");
  ciudad.addEventListener("blur", clima);

  document.getElementById("buscar").addEventListener("click", clima);
  // Evento para detectar cuando se presiona Enter
  ciudad.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clima();
    }
  });
};

async function clima() {
  let municipio = String(document.getElementById("ciudad").value);

  let codigoMunicipio = await cargarMunicipios(municipio); // Aquí se usa await

  try {
    // Primera petición para obtener la URL de los datos
    const response = await fetch(
      `${serverUrl}/api/prediccion/especifica/municipio/diaria/${codigoMunicipio}${apikey}`,
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

    const datosBuffer = await datosResponse.arrayBuffer();
    const datosDecoder = new TextDecoder("ISO-8859-15");
    const datosText = datosDecoder.decode(datosBuffer);
    const datosClima = JSON.parse(datosText);
    /* console.log("Datos del clima:", datosClima); */

    // Actualiza la interfaz con la información
    actualizarUI(datosClima);
  } catch (error) {
    console.error("Error al realizar la solicitud:", error);
    document.getElementById("ubicacion").textContent =
      "Error al realizar la solicitud o municipio no encontrado";

    document.getElementById("caja1").style.display = "none";
    document.getElementById("caja3").style.display = "none";
    document.getElementById("provincia").style.display = "none";
    document.getElementById("cielo").style.display = "none";
    document.getElementById("pronostico").style.display = "none";
    document.getElementById("icono-animado").style.display = "none";
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
        return municipios[key]; //devuelve el codigo y el nombre correcto
      }
    }

    console.log("Municipio no encontrado");
  } catch (error) {
    console.error("Error al cargar el archivo JSON:", error);
  }
}

function actualizarUI(datosClima, municipio) {
  const prediccion = datosClima[0].prediccion.dia[0];
  const temperaturaMin = prediccion.temperatura.minima;
  const temperaturaMax = prediccion.temperatura.maxima;
  const datosPorFranja = obtenerTiempoActual(
    prediccion.viento,
    prediccion.estadoCielo,
    prediccion.temperatura.dato,
    prediccion.probPrecipitacion,
    prediccion.sensTermica.dato
  );

  // mostrar elementos ocultos
  document.getElementById("caja1").style.display = "inline-block";
  document.getElementById("caja3").style.display = "inline-block";
  document.getElementById("provincia").style.display = "block";
  document.getElementById("cielo").style.display = "block";
  document.getElementById("pronostico").style.display = "flex";

  // actualizar los textos
  document.getElementById(
    "temperatura-valor"
  ).innerText = `Min: ${temperaturaMin}°C | Max: ${temperaturaMax}°C`;
  document.getElementById("ubicacion").textContent = datosClima[0].nombre;
  document.getElementById(
    "temperatura-descripcion"
  ).textContent = `Sensación térmica: ${datosPorFranja.sensacion}°C`;
  document.getElementById(
    "temp-actual"
  ).textContent = `${datosPorFranja.temperatura}°C`;

  document.getElementById(
    "viento-velocidad"
  ).textContent = `${datosPorFranja.viento.velocidad} km/h`;
  document.getElementById(
    "prob-prec"
  ).textContent = `${datosPorFranja.probabilidadPrecipitacion}%`;
  document.getElementById(
    "franja-prec"
  ).textContent = `Franja: ${datosPorFranja.periodoPrecipitacion}h`;
  document.getElementById("provincia").textContent = datosClima[0].provincia;
  // iconos animados
  let iconoAnimado = document.getElementById("icono-animado");
  if (!iconoAnimado) {
    iconoAnimado = document.createElement("img");
    iconoAnimado.id = "icono-animado";
    document
      .getElementById("caja2")
      .insertBefore(iconoAnimado, document.getElementById("cielo"));
  }
  const iconoSrc =
    icons[datosPorFranja.estadoCielo.descripcion] || icons["Sin datos"];
  iconoAnimado.src = iconoSrc;
  document.getElementById("icono-animado").style.display = "block";
  document.getElementById("cielo").textContent =
    datosPorFranja.estadoCielo.descripcion || "Sin datos";

  let predicciones = document.getElementsByClassName("dia");
  let contador = 1;

  for (const dia of predicciones) {
    const prediccion = datosClima[0].prediccion.dia[contador];
    let fechaPro = new Date(prediccion.fecha);
    const formateador = new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
    }); // Para poner formato 1 enero, etc.

    const iconoSrc =
      icons[prediccion.estadoCielo[0].descripcion] || icons["Sin datos"];
    dia.children[1].src = iconoSrc;
    dia.children[2].textContent = `Min: ${prediccion.temperatura.maxima}°C | Max: ${prediccion.temperatura.minima}°C`;

    dia.firstElementChild.innerText = formateador.format(fechaPro);
    contador++;
  }
}

// Para obtener los datos sengún la franja horaria
function obtenerTiempoActual(
  viento,
  cielo,
  temperatura,
  probPrecipitacion,
  sensacion
) {
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
  // Obtener la temperatura más cercana a la hora actual
  let sensActual = { value: 0, hora: 0 };
  for (let i = 0; i < sensacion.length; i++) {
    if (
      i === 0 ||
      Math.abs(sensacion[i].hora - horaActual) <
        Math.abs(sensActual.hora - horaActual)
    ) {
      sensActual = sensacion[i];
    }
  }

  // Devolver un objeto con toda la información
  return {
    probabilidadPrecipitacion,
    periodoPrecipitacion: periodoActual,
    viento: vientoActual,
    estadoCielo: estadoCieloActual,
    temperatura: temperaturaActual.value,
    sensacion: sensActual.value,
    horaTemperatura: temperaturaActual.hora,
  };
}

window.addEventListener("DOMContentLoaded", inicio);
