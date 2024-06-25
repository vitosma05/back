//archivo para manejar las rutas de usuarios

import { Router } from "express";
import {
  auth,
  createUsers,
  getData,
  logIn,
  addMateria,
  cursarMateria,
  cursar,
  getMateriaById,
} from "../controller/users";

//objeto para manejo de url
const routerUsers = Router();

//Enpoint para loguear usuario
/**
 * @swagger
 * /user/login:
 *  post:
 *      sumary: loguear usuario
 */
routerUsers.get("/user/login", logIn);

/**
 * @swagger
 * /usersp:
 *  post:
 *      sumary: crea usuarios
 */
routerUsers.post("/user/usersp", createUsers);

/**
 * @swagger
 * /user/getData:
 *  get:
 *      sumary: Obtener lista de materias
 */
routerUsers.get("/user/getData", auth, getData);

routerUsers.post("/user/addMateria", auth, addMateria);

/**
 * @swagger
 * /user/cursar:
 *   post:
 *     summary: Relacionar un usuario con una materia
 *     tags: [Usuarios, Materias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dni:
 *                 type: string
 *                 description: DNI del usuario
 *               idMateria:
 *                 type: integer
 *                 description: ID de la materia
 *     responses:
 *       200:
 *         description: Materia asignada exitosamente
 *       500:
 *         description: Error del servidor
 */
routerUsers.post("/user/cursar", cursar);

routerUsers.get("/user/getMateriaById/:dni", getMateriaById);

export default routerUsers;
