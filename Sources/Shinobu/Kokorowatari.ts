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
    Urusai.Error(e);
    process.exit(0);
  }

  Urusai.Verbose('Interrupter received');
});

export class Kokorowatari {


  public static async Initialize(): Promise<void> {

    Urusai.Text(`
    _  ___         _                                _             _ 
   | |/ / |       | |                              | |           (_)
   | ' /| | _____ | | _____  _ __ _____      ____ _| |_ __ _ _ __ _ 
   |  < | |/ / _ \\| |/ / _ \\| '__/ _ \\ \\ /\\ / / _\` | __/ _\` | '__| |
   | . \\|   < (_) |   < (_) | | | (_) \\ V  V / (_| | || (_| | |  | |
   |_|\\_\\_|\\_\\___/|_|\\_\\___/|_|  \\___/ \\_/\\_/ \\__,_|\\__\\__,_|_|  |_|
                                                                    
                                                                    
  `)
    await Agent.Initialize();
    await Agent.Start();
  }
}