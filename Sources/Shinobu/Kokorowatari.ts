import { Urusai } from "../Common/Urusai/Urusai";
import { Agent } from "./Kokorowatari/Agent";

process.on('unhandledException', (e) => {

  if ('INT' != e.message) {
    Urusai.Error('Process exited with exception:', e.message);
    process.exit(0);
  }
  Urusai.Verbose('Interrupter received');

})

process.on('unhandledRejection', (e) => {

  if ('INT' != e) {
    Urusai.Error('Process exited with exception in Promise:', (e as any).toString());
    process.exit(0);
  }

  Urusai.Verbose('Interrupter received');
});

export class Kokorowatari {


  public static async Pool(): Promise<void> {
    await Agent.Initialize();
    await Agent.Start();
  }
}