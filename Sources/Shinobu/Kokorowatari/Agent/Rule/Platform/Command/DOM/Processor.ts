import { load } from "cheerio";
import { writeFileSync } from "fs";
import { Urusai } from "../../../../../../../Common/Urusai/Urusai";
import { Expression } from "../../../../Rule/Expression";

export type ProcessorConfig = string;

export class Processor {

  public readonly Sections: [string, string];

  constructor(processorConfig: ProcessorConfig) {

    // Parse expression
    this.Sections = processorConfig.split('=>') as [string, string];
  }

  /**
   * Perform processor on dom
   */
  public async Process(domObject: cheerio.Root, sessionStorage: any, additionalZones: any): Promise<void> {

    Urusai.Verbose('Executing process expression', this.Sections);
    let $$ = domObject.root();
    let $: cheerio.Cheerio = eval(this.Sections[0]);

    Urusai.Verbose($.length, 'items in the loop');
    for (let $i = 0; $i < $.length; $i++) {
      $$ = $.eq($i);
      eval(this.Sections[1]);
    }
  }
}
