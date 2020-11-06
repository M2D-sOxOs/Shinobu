import { Kokorowatari } from "./Shinobu/Kokorowatari"
import { Urusai } from "./Common/Urusai/Urusai";
import { Jinja } from "./Common/Jinja/Jinja";
import { Master } from "./Shinobu/Kokorowatari/Agent/Master";

module Shinobu {

  Urusai.Text(`
 ___  _   _  ____  _  _  _____  ____  __  __ 
/ __)( )_( )(_  _)( \\( )(  _  )(  _ \\(  )(  )
\\__ \\ ) _ (  _)(_  )  (  )(_)(  ) _ < )(__)( 
(___/(_) (_)(____)(_)\\_)(_____)(____/(______)

Project Shinobu`);
  // Three steps
  // 1. Start Jinja
  // 2. Start 

  (async () => {

    Urusai.Verbose('Initializing Jinja');
    await Jinja.Initialize();

    Urusai.Verbose('Initializing Urusai');
    await Urusai.Initialize();

    Urusai.Verbose('Initializing Kokorowatari pool')
    await Kokorowatari.Pool();

    Master.Send({
      Action: 'CONTROL',
      Message: 'TRIAL_COMMAND',
      Data: {
        "Command": "Mercari.Commands.JSON-ItemDetail",
        "Proxy": "Mercari.Proxies.Fiddler",
        "Input": {
          "Item": "m63162206098",
          "Status": "on_sale,trading,sold_out"
        }
      }
    });

    setTimeout(() => {

      Master.Send({
        Action: 'CONTROL',
        Message: 'TOKEI_REPORT',
        Data: {
        }
      });
    }, 10000);
  })();
}