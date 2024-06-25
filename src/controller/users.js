import { connect } from "../databases";
import jwt from "jsonwebtoken";
const secreto = process.env.SECRET_KEY;

export const logIn = async (req, res) => {
  try {
    const { dni, password } = req.body; //peticion
    //cadena conexion
    const cnn = await connect();

    const q = "SELECT pass FROM alumno WHERE dni=?";
    const parametros = [dni];

    const [row] = await cnn.query(q, parametros);
    console.log("resultado", row);
    //si no existe el dni el arreglo viene vacio por lo cual su longitud sera 0
    if (row.length === 0)
      return res
        .status(400)
        .json({ succes: false, message: "usuario no existe" });
    //contraseñas encriptadas.
    //Compara la contraseña ingresada con la constraseña de la bd
    if (password === row[0].pass) {
      //exito en el login
      //crear y enviar un token
      const token = getToken({ sub: dni });
      return res
        .status(200)
        .json({ succes: true, message: "login ok", token: token });
    } else {
      //no coincide
      return res.status(401).json({ succes: false });
    }
  } catch (error) {
    console.log("error de login", error.message);
    return res.status(500).json({ message: "error", error: error });
  }
};

//funcion para validar cualquier tabla y cualquier fila
const userExist = async (cnn, tabla, atributo, valor) => {
  try {
    const [row] = await cnn.query(
      `SELECT * FROM ${tabla} WHERE ${atributo}=?`,
      [valor]
    );
    return row.length > 0;
  } catch (error) {
    console.log("userExist", error);
  }
};
//crear usuarios desde el sigup
export const createUsers = async (req, res) => {
  try {
    //establecer la conexion
    const cnn = await connect();
    //desestructurar el cuerpo de mi peticion http
    const { nombre, dni, correo, password } = req.body;

    //validar con mi funcion
    const dniExist = await userExist(cnn, "alumno", "dni", dni);
    const correoExist = await userExist(cnn, "alumno", "correo", correo);

    if (dniExist || correoExist) {
      return res.json({ message: "ya existe el usuario " });
    } else {
      //creamos el query, usamos ? para prevenir inyeccion sql
      const row = await cnn.query(
        "INSERT INTO alumno( nombre, dni, correo, pass) values ( ?, ?, ?, ?)",
        [nombre, dni, correo, password]
      );

      //validar que no existe el dni y correo
      const [validar] = await cnn.query("SELECT * FROM alumno WHERE dni=?", [
        dni,
      ]);
      const [validar2] = await cnn.query(
        "SELECT * FROM alumno WHERE correo=?",
        [correo]
      );

      //comprobar si se inserto en la bd
      if (row.affectedRows === 1) {
        //si se inserto
        res.json({
          message: "se creo el alumno con exito",
          success: true,
        });
      } else {
        res.status(500).json({ message: "no se creo el usuario" });
      }
    }
  } catch (error) {
    console.log("create user", error);
    res.json({
      message: "No se pudo conectar con la base de datos",
      success: false,
    });
  }
};

//generar token
export const getToken = (paylogad) => {
  //generar token
  const token = jwt.sign(paylogad, secreto, { expiresIn: "1500000000000000m" });
  return token;
  try {
  } catch (error) {
    console.log(error);
    return error;
  }
};

//mideelware

export const auth = (req, res, next) => {
  //vamos a guardar el token que viene del front
  const token = req.headers["mani"];

  //verificar si el token esta en la peticion

  if (!token) return res.status(400).json({ message: "sin token" });

  //verificar si el token es valido

  jwt.verify(token, secreto, (error, user) => {
    //comprobar si hay error -> si el token es invalido
    if (error) {
      return res.status(400).json({ message: "token invalido" });
    } else {
      //cargar la recuest con los datos del usuario
      req.user = user;
      //vamos a ejecutar la siguiente funcion
      next();
    }
  });
};

//fncion que emula una consultaa la bd ->

export const getData = async (req, res) => {
  const user = req.user;

  //meterme a la bs, obtener la lista de materias
  const materias = [
    { id: 10, nombre: "web dinamica" },
    { id: 11, nombre: "so" },
    { id: 12, nombre: "si" },
  ];
  return res.status(200).json({ materias: materias, usuarios: user });
};

// Función para agregar una nueva materia
export const addMateria = async (req, res) => {
  try {
    const { nombre } = req.body; // Desestructurar el cuerpo de la petición
    console.log(nombre);
    // Establecer la conexión
    const cnn = await connect();

    // Query para insertar la nueva materia
    const query = "INSERT INTO materia (nombre_materia) VALUES (?)";
    const [result] = await cnn.query(query, [nombre]);

    // Comprobar si se insertó correctamente
    if (result.affectedRows === 1) {
      res
        .status(201)
        .json({ message: "Materia creada con éxito", success: true });
    } else {
      res
        .status(500)
        .json({ message: "No se pudo crear la materia", success: false });
    }
  } catch (error) {
    console.log("addMateria", error);
    res
      .status(500)
      .json({ message: "Error al agregar la materia", success: false });
  }
};

// Nueva función: Relacionar usuario con materia
export const cursar = async (req, res) => {
  try {
    const { dni, idMateria } = req.body;
    const cnn = await connect();
    const [row] = await cnn.query(
      "INSERT INTO cursar (dni, id_m) VALUES (?, ?)",
      [dni, idMateria]
    );

    if (row.affectedRows === 1) {
      res.json({
        message: "Materia asignada al alumno con éxito",
        success: true,
      });
    } else {
      return res.status(500).json({ message: "No se pudo asignar la materia" });
    }
  } catch (error) {
    console.log("cursar", error);
    res.status(500).json({ message: "Error en el servidor", success: false });
  }
};

// Nueva función: Obtener materias de un alumno por ID
export const getMateriaById = async (req, res) => {
  try {
    const { dni } = req.params;
    const cnn = await connect();

    // Modificar la consulta para que use los nombres de columna correctos
    const [rows] = await cnn.query(
      "SELECT m.id_m, m.nombre_materia FROM materia m JOIN cursar c ON m.id_m = c.id_m WHERE c.dni = ?",
      [dni]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No se encontraron materias para el alumno",
        });
    }

    return res.status(200).json({ success: true, materias: rows });
  } catch (error) {
    console.log("getMateriaById", error);
    return res
      .status(500)
      .json({ message: "Error en el servidor", error: error });
  }
};
