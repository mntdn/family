const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const fsBasic = require("fs");
const zlib = require("zlib");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data/data.json");

app.use(cors());
app.use(express.json());

function getCurrentDateString() {
  var sDate;
  var oDate = new Date();
  sDate =
    oDate.getYear() +
    1900 +
    (oDate.getMonth() + 1 < 10
      ? "0" + (oDate.getMonth() + 1)
      : oDate.getMonth() + 1) +
    oDate.getDate() +
    "-" +
    oDate.getHours() +
    (oDate.getMinutes() < 10
      ? "0" + oDate.getMinutes()
      : oDate.getMinutes()) +
    (oDate.getSeconds() < 10 ? "0" + oDate.getSeconds() : oDate.getSeconds());
  return sDate;
}

// --- Endpoint 1: GET /data ---
// Serves the contents of data.json
app.get("/data", async (req, res) => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    res.type("application/json").send(raw);
  } catch (err) {
    console.error("Failed to read data.json:", err);
    res.status(500).json({ error: "Could not read data file" });
  }
});

// --- Endpoint 2: POST /data ---
// Overwrites data.json with the JSON body sent in the request
app.post("/data", async (req, res) => {
  const mealToUpdate = req.body;
  if (!mealToUpdate || typeof mealToUpdate !== "object") {
    return res
      .status(400)
      .json({ error: "Request body must be a JSON object" });
  }
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  var meals = JSON.parse(raw);
  let m = meals.filter((_) => _.day == mealToUpdate.day);
  if (m && m[0] && m[0]?.day) {
    m[0].lunch = mealToUpdate.lunch;
    m[0].lunchUrl = mealToUpdate.lunchUrl;
    m[0].dinner = mealToUpdate.dinner;
    m[0].dinnerUrl = mealToUpdate.dinnerUrl;
  } else {
    meals.push(mealToUpdate);
  }

  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(meals), "utf-8");
    const inputFile = fsBasic.createReadStream(DATA_FILE);
    const backupFile = fsBasic.createWriteStream(path.join(__dirname, "backup/data" + getCurrentDateString() + ".gz"));
    inputFile.pipe(zlib.createGzip()).pipe(backupFile);
    res.json({ message: "data.json updated successfully", data: mealToUpdate });
  } catch (err) {
    console.error("Failed to write data.json:", err);
    res.status(500).json({ error: "Could not write data file" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  GET  /data  -> read data.json`);
  console.log(`  POST  /data  -> update data.json (send JSON body)`);
});
