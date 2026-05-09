import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for STL conversion
  // NOTE: In a real production environment with OpenSCAD installed, 
  // this would execute 'openscad -o output.stl input.scad'
  app.post("/api/convert-to-stl", async (req, res) => {
    const { scadCode, title } = req.body;

    if (!scadCode) {
      return res.status(400).json({ error: "Missing SCAD code" });
    }

    try {
      console.log(`Transitioning SCAD to STL for: ${title}`);
      
      // Since OpenSCAD is a thick binary, we typically use a cloud function 
      // or a pre-configured container with OpenSCAD.
      // For this demo, we'll return a helpful message or a simulated blob
      // if the binary isn't available in the shell.
      
      // If we had the binary, we'd do something like:
      // const fs = await import('fs/promises');
      // await fs.writeFile('temp.scad', scadCode);
      // await execPromise('openscad -o temp.stl temp.scad');
      // const stl = await fs.readFile('temp.stl');
      // res.setHeader('Content-Type', 'application/octet-stream');
      // res.send(stl);

      // Mocker / Placeholder for the requested architecture
      // We inform the user that this requires the OpenSCAD binary in the environment.
      res.status(501).json({ 
        error: "Server-side OpenSCAD binary not found.", 
        message: "To enable full SCAD -> STL conversion, the 'openscad' binary must be installed on the host system. The frontend 'Export Preview STL' uses Three.js geometry as an alternative."
      });

    } catch (error) {
      console.error("Conversion error:", error);
      res.status(500).json({ error: "Internal server error during conversion" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
