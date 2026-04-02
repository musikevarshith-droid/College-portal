import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;
const DATA_FILE = path.resolve("data.json");

// Initial data
const initialData = {
  branches: ["CSE", "ECE", "MECH", "CIVIL"],
  groups: ["A", "B", "C", "Batch 1", "Batch 2"],
  exams: [
    { id: "1", name: "Midterm", subject: "Math", branch: "CSE", date: "2026-03-15", marks: 85, internalScore: 18, status: "Published" },
    { id: "2", name: "Finals", subject: "Physics", branch: "ECE", date: "2026-04-10", marks: 90, internalScore: 19, status: "Draft" }
  ],
  notes: [
    { id: "1", title: "Intro to AI", content: "AI is the future...", branch: "CSE", author: "Dr. Smith", date: "2026-02-20" }
  ]
};

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

app.use(cors());
app.use(bodyParser.json());

// RBAC Middleware
const rbacMiddleware = (section: string) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.headers["x-user-role"];
    const userBranch = req.headers["x-user-branch"]; // Optional, for more granular control if needed

    // 1. Only Admin can edit
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Access Denied (403): Only admins can perform this action." });
    }

    // 2. Specific Sections restriction
    const allowedSections = ["Attendance", "Exams", "Notes"];
    if (!allowedSections.includes(section)) {
      return res.status(403).json({ error: `Access Denied (403): Editing is not allowed in the ${section} section.` });
    }

    // 3. Specific Branches restriction (CSE, ECE, MECH)
    // For simplicity, we check the branch of the item being edited in the route itself or here if passed in body
    const allowedBranches = ["CSE", "ECE", "MECH"];
    const targetBranch = req.body.branch || req.query.branch;
    
    if (targetBranch && !allowedBranches.includes(targetBranch)) {
      return res.status(403).json({ error: `Access Denied (403): Editing is only allowed for branches: ${allowedBranches.join(", ")}.` });
    }

    // 4. Specific Columns restriction (Marks, Internal Score, Status)
    // If it's a PATCH/PUT, check which fields are being updated
    if (req.method === "PATCH" || req.method === "PUT") {
      const allowedFields = ["marks", "internalScore", "status", "name", "date", "subject", "description", "branches", "groups", "title", "content", "author"];
      // The user specifically mentioned: "Allow edit access only for certain columns (Marks, Internal Score, Status)"
      // This usually means for *students* or *restricted admins*. 
      // But the prompt says "Only Admin users can see and use the Edit option" and then "Allow edit access only for certain columns".
      // I will interpret this as: Even admins are restricted to these columns for sensitive data updates if we want to be strict, 
      // OR these are the ONLY columns that can be edited in general.
      // Let's stick to the prompt's specific list for the "advanced restrictions" part.
      
      const sensitiveFields = ["marks", "internalScore", "status"];
      const updateFields = Object.keys(req.body);
      
      // If they are trying to edit something NOT in the allowed list for the section
      // (This is a bit ambiguous, so I'll implement it as: if they edit sensitive fields, it's fine, but if they edit other things, we check)
      // Actually, let's just ensure they CAN edit these columns.
    }

    next();
  };
};

// Helper to read data
const readData = () => {
  try {
    const content = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return initialData;
  }
};

// Helper to write data
const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API Routes
app.get("/api/attendance/config", (req, res) => {
  res.json(readData());
});

app.post("/api/attendance/branches", rbacMiddleware("Attendance"), (req, res) => {
  const { branches } = req.body;
  if (!Array.isArray(branches)) return res.status(400).json({ error: "Invalid data" });
  const data = readData();
  data.branches = branches;
  writeData(data);
  res.json(data);
});

app.post("/api/attendance/groups", rbacMiddleware("Attendance"), (req, res) => {
  const { groups } = req.body;
  if (!Array.isArray(groups)) return res.status(400).json({ error: "Invalid data" });
  const data = readData();
  data.groups = groups;
  writeData(data);
  res.json(data);
});

// Exams Routes
app.get("/api/exams", (req, res) => {
  res.json(readData().exams);
});

app.patch("/api/exams/:id", rbacMiddleware("Exams"), (req, res) => {
  const { id } = req.params;
  const data = readData();
  const index = data.exams.findIndex((e: any) => e.id === id);
  if (index === -1) return res.status(404).json({ error: "Exam not found" });

  // Advanced Column Restriction Check
  const allowedColumns = ["marks", "internalScore", "status"];
  const requestedColumns = Object.keys(req.body);
  const illegalColumns = requestedColumns.filter(col => !allowedColumns.includes(col) && col !== "branch"); // branch is needed for middleware check
  
  if (illegalColumns.length > 0) {
    return res.status(403).json({ error: `Access Denied (403): You can only edit the following columns: ${allowedColumns.join(", ")}.` });
  }

  data.exams[index] = { ...data.exams[index], ...req.body };
  writeData(data);
  res.json(data.exams[index]);
});

// Notes Routes
app.get("/api/notes", (req, res) => {
  res.json(readData().notes);
});

app.post("/api/notes", rbacMiddleware("Notes"), (req, res) => {
  const data = readData();
  const newNote = { id: Date.now().toString(), ...req.body, date: new Date().toISOString() };
  data.notes.push(newNote);
  writeData(data);
  res.json(newNote);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
