import path from "path";
import util from "util";
import { exec } from "child_process";
import { NodeIO } from "@gltf-transform/core";
import { prune, textureResize } from "@gltf-transform/functions";
import { DracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const convert = async (modelPath, { decimateRatio = 0.7 }) => {
  const execAsync = util.promisify(exec);
  await execAsync(`blender -b -P 2gltf.py -- "${modelPath}" ${decimateRatio}`);
};

const optimize = async (modelPath, { id, draco = true }) => {
  const directory = path.dirname(modelPath);
  const filename = path.basename(modelPath).split(".")[0];
  const io = new NodeIO();
  if (draco) {
    io.registerExtensions([DracoMeshCompression]).registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });
  }
  const document = await io.read(`${directory}/${filename}.glb`);
  await document.transform(
    prune(),
    textureResize({
      size: [1024, 1024],
    })
  );
  if (draco) document.createExtension(DracoMeshCompression).setRequired(true);
  const resultPath = `${directory}/${id}.glb`
  await io.write(resultPath, document);
  return resultPath;
};

const pipeline = async (path, params) => {
  await convert(path, params);
  return await optimize(path, params);
};

export default pipeline;
