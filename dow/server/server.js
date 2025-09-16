// dow\server\server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const cors = require("cors");

// ============== 基础配置 ==============
const app = express();
const PORT = 3000;
const HOST = "http://192.168.100.95"; // 部署后改成你的域名或服务器IP
const uploadDir = path.join(__dirname, "uploads");

// CORS：前后端分离时必须
app.use(cors({ origin: true })); // 也可指定成你的前端域名

// 确保 uploads 目录存在
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ============== Multer上传配置 ==============
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // 时间戳 + 随机串 + 原名，避免重名
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const rnd = Math.random().toString(36).slice(2, 8);
    cb(null, `${Date.now()}-${rnd}-${base}${ext}`);
  }
});

// 仅允许 .apk（如需不限类型，移除 fileFilter）
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 上限 1GB，可自行调整
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".apk") return cb(null, true);
    cb(new Error("只允许上传 .apk 文件"));
  }
});

// ============== 路由 ==============

// 健康检查（可选）
app.get("/health", (req, res) => res.send("OK"));

// 上传接口：form-data 字段名必须为 "file"
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filename = req.file.filename;
    const downloadUrl = `${HOST}:${PORT}/download/${encodeURIComponent(filename)}`;

    // 生成二维码（DataURL，可直接 <img src="..."> 显示）
    const qrDataUrl = await QRCode.toDataURL(downloadUrl);

    res.json({
      ok: true,
      message: "Upload success",
      fileName: filename,
      fileUrl: downloadUrl,
      qrCodeDataUrl: qrDataUrl
    });
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message || "Upload failed" });
  }
});

// 直链下载接口：强制浏览器弹下载（非预览）
app.get("/download/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename); // 防目录穿越
  const filePath = path.join(uploadDir, safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // 提示为附件下载；对 APK 会触发保存/安装流程（取决于设备/浏览器策略）
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.download(filePath, safeName, (err) => {
    if (err) console.error("download error:", err.message);
  });
});

// 兜底404
app.use((req, res) => res.status(404).json({ ok: false, message: "Not Found" }));

app.listen(PORT, () => {
  console.log(`Server running: ${HOST}:${PORT}`);
});
