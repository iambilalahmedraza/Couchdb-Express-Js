import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import nano from "nano";

const app = express();
const port = 3001;
app.use(express.json());
const couch = nano("http://Bilal:Bilal123@localhost:5984");

const dbName = "userdb";
const db = couch.db.use(dbName);

couch.db
  .create(dbName)
  .then((body) => {
    console.log("Database created");
  })
  .catch((err: any) => {
    if (err.statusCode === 412) {
      console.log("Database already exists");
    } else {
      console.error("Error creating database:", err);
    }
  });

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "CouchDB API For User Information",
      version: "3.1.0",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ["src/index.ts"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *       required:
 *         - name
 *         - description
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: A list of users
 */
app.get("/users", async (req: Request, res: Response) => {
  try {
    const response = await db.list({ include_docs: true });
    res.json(response.rows.map((row: any) => row.doc));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
    console.log(error);
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 */
app.post("/users", async (req: Request, res: Response) => {
  try {
    const user = req.body;
    const response = await db.insert(user);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: "internal Server error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get an user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user
 */
app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.get(id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 */
app.put("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.body;
    const existingUser = await db.get(id);
    const updatedUser = { ...existingUser, ...user };
    const response = await db.insert(updatedUser);
    res.json(response);
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete an user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User deleted
 */
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.get(id);
    await db.destroy(id, user._rev);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
