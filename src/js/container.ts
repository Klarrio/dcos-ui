import "reflect-metadata"; // Needed for inversify
import { Container } from "@extension-kid/core";

import dataLayerExtensionFactory from "@extension-kid/data-layer";
import jobsExtensionFactory from "#PLUGINS/jobs/src/js";
import repositoriesExtensionFactory from "#PLUGINS/catalog/src/js";

import mesosStream, { MesosStreamType } from "./core/MesosStream";

const container = new Container();

container.bind(MesosStreamType).toConstantValue(mesosStream);
container.load(dataLayerExtensionFactory());
container.load(jobsExtensionFactory());
container.load(repositoriesExtensionFactory());

export default container;
