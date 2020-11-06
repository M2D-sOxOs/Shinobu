import { platform } from "os";
import { Jinja } from "../../../../Common/Jinja/Jinja";
import { Platform } from "./Rule/Platform";

export type Table<T> = { [k: string]: T };

export class Rule {

  public static Platforms: Table<Platform> = {};

  public static async Initialize() {

    const platformObjects = Jinja.Get('Kokorowatari.Platforms');
    for (const platformKey in platformObjects) (this.Platforms[platformKey] = new Platform(platformObjects[platformKey])).Build();

  }
}