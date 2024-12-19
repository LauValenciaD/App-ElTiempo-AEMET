const xlsx = require("xlsx");
const fs = require("fs");

// Cargar el archivo Excel
const workbook = xlsx.readFile("diccionario24.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convertir la hoja a JSON
const data = xlsx.utils.sheet_to_json(sheet, {
  header: ["CODAUTO", "CPRO", "CMUN", "DC", "NOMBRE"], // Define los encabezados
  range: 1, // Ignora la primera fila si no es válida
});

// Crear el objeto de mapeo
const municipios = {};
data.forEach((row) => {
  // Concatenar CPRO y CMUN para generar el ID
  const idMunicipio =
    String(row.CPRO).padStart(2, "0") + String(row.CMUN).padStart(3, "0"); // Formato de 5 cifras
  municipios[row.NOMBRE] = idMunicipio;
});

// Guardar en un archivo JSON
fs.writeFileSync(
  "municipios.json",
  JSON.stringify(municipios, null, 2),
  "utf-8"
);

console.log("Datos guardados en municipios.json");
