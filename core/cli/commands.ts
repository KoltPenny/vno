import Factory from "../factory/Factory.ts";
import * as print from "./stdout.ts";
import info from "./info.ts";
import * as fn from "./fns.ts";
import { fs, path } from "../utils/deps.ts";
import { createSinglePageApp, renderProgress } from "./create.ts";
import { runDevServer } from "./dev.ts";
import { quietArg } from "./fns.ts";
import { cmnd, serverTs, vnoconfig } from "./constants.ts";
import { Config } from "../dts/factory.d.ts";
import { ssrTemplate } from "../cli/templates.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import * as out from "./constants.ts";

//Contains Create, Build, Run, and flag commands
export const create = async function (args: string[]): Promise<void> {
  args = Array.from(args);

  // prompt user to select a type of app: universal app or single page app
  let appType: string | null = null;
  const spaFlagIndex = args.findIndex((arg) => arg === "--spa");
  if (spaFlagIndex >= 0) {
    appType = "spa";
    args.splice(spaFlagIndex, 1);
  } else {
    appType = await prompt(out.promptUniversal, "universal/spa");
  }

  //.test is method on regex pattern - it returns true/false based on if args[0] is 'create' if no 'create', return
  if (!cmnd.create.test(args[0])) return;

  //await statement on install/vno.ts is why we have all this information at the time of run
  //pops off each arg of the array to give title, root, port, components
  const mutable = args.slice(1);

  const title = mutable.shift();
  const root = mutable.shift();
  const port = mutable.shift();
  const components = mutable.length > 0 ? mutable : undefined;

  if (title) {
    const dir = `${Deno.cwd()}/${title}`;
    await fs.ensureDir(dir);
    Deno.chdir(dir);
  }

  const __dirname = new URL(".", import.meta.url).pathname;

  if (appType === "universal") {
    const currDir = Deno.cwd();
    const templatePath = path.resolve(
      __dirname,
      "../templates/universal",
    );

    fn.green(out.creating);

    renderProgress();

    // copy vno-ssg directory to current build directory
    fs.copy(templatePath, currDir, { overwrite: true });
  } else {
    //arguments passed into CLI placed into createSinglePageApp as obj
    await createSinglePageApp({
      title,
      root,
      port,
      components,
    });
  }

  return;
};

export let ssr = false;

//The Promise<void> syntax means the promise will resolve to undefined
export const build = async function (args: string[]): Promise<void> {
  //if nothing placed into CLI, return, zero index is the command build
  if (!cmnd.build.test(args[0])) return;

  if (cmnd.buildSsr.test(args[1])) {
    //If server.ts files exists, do not write over it
    const isServerTsExist: boolean = existsSync(`${Deno.cwd()}/${serverTs}`);
    !isServerTsExist
      ? await Deno.writeTextFile(serverTs, ssrTemplate)
      : fn.green(`[${serverTs} file located]`);
    fn.yellow(`=> ${Deno.cwd()}`);

    //configPAth is cwd/filename (with extention because ts)
    const configPath = `${Deno.cwd()}/${vnoconfig}`;
    // Deno.readTextFile returns entire contents of configFile as a string
    const json = await Deno.readTextFile(configPath);
    //the returned string from  Deno.readTextFile is converted into object of type Config
    const res = JSON.parse(json) as Config;
    res.server = `${Deno.cwd()}/${serverTs}`;
    await Deno.writeTextFile(configPath, JSON.stringify(res));
  }

  //if args index 2 is not --ssr
  const path = !cmnd.buildSsr.test(args[1]) ? args[1] : undefined;
  if (path) {
    const dir = `${Deno.cwd()}/${path}`;
    //tests if the given directory exists, chdir changes the CWD to the specified path
    if (await fs.exists(dir)) Deno.chdir(dir);
  }

  const vno = Factory.create();
  //vno.build referanced the build function on the Factory prototype chain, not the CLI imput
  await vno.build();

  if (quietArg(args[1]) || quietArg(args[2])) print.QUIET();
  //"Vno build complete"
  //ASCII function prints the logo if quiet is passed as an arg
  else print.ASCII();
};

export const run = async function (args: string[]): Promise<void> {
  if (!cmnd.run.test(args[0])) return;

  const vno = Factory.create();
  await vno.build();

  if (quietArg(args[2]) || quietArg(args[3])) print.QUIET();
  else print.ASCII();
  const { port, hostname } = vno;

  if (cmnd.dev.test(args[1])) {
    //for live reload
    await vno.build(true);
    await runDevServer(port, hostname);

    Deno.exit(0);
  } else if (cmnd.server.test(args[1])) {
    if (vno.server == null) return;
    try {
      const handler = (await import(path.resolve(vno.server)))?.default;
      await handler();
      Deno.exit(0);
    } catch (e) {
      console.error(e);
      Deno.exit(1);
    }
  }
};

export const flags = function (args: string[]): void {
  const helpArg = cmnd.help.test(args[0]);
  const infoArg = cmnd.info.test(args[0]);

  if (!helpArg && !infoArg) return;

  print.ASCII();
  print.INFO(info);

  if (helpArg) {
    print.CMDS(info);
    print.OPTIONS(info);
  } else console.log("\n");
};
