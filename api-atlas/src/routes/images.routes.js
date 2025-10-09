import { Router } from "express";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";
import busboy from "busboy";
const r = Router();
function bucket() { return new GridFSBucket(mongoose.connection.db, { bucketName: "images" }); }
r.post("/images", async (req, res) => {
  const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: 10 * 1024 * 1024 } });
  let uploadedId = null;
  bb.on("file", (_name, file, info) => {
    const { filename, mimeType } = info;
    const up = bucket().openUploadStream(filename, { contentType: mimeType });
    uploadedId = up.id;
    file.pipe(up);
    up.on("error", () => res.sendStatus(500));
    up.on("finish", () => res.status(201).json({ fileId: uploadedId, filename, mimeType }));
  });
  bb.on("error", () => res.sendStatus(400));
  req.pipe(bb);
});
r.get("/images/:id", async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const dl = bucket().openDownloadStream(id);
    dl.on("file", f => { if (f?.contentType) res.setHeader("Content-Type", f.contentType); });
    dl.on("error", () => res.sendStatus(404));
    dl.pipe(res);
  } catch { res.sendStatus(400); }
});
export default r;
