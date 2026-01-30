require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Mini Fullstack App is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
