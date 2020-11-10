import { Kokorowatari } from "./Shinobu/Kokorowatari"
import { Urusai } from "./Common/Urusai/Urusai";
import { Jinja } from "./Common/Jinja/Jinja";
import { Master } from "./Shinobu/Kokorowatari/Agent/Master";
import { Koyomi } from "./Shinobu/Koyomi";

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
    await Kokorowatari.Initialize();
    
    Urusai.Verbose('Initializing Koyomi')
    await Koyomi.Initialize();
    

    // if (!requestId) {
    //   Urusai.Error('Cannot send request')
    //   return;
    // } else {
    //   Urusai.Verbose('Sent Request ID:', requestId);
    // }

    // Master.Callback((s, r, d) => {
    //   Urusai.Verbose('Received Request ID:', r);
    //   Urusai.Verbose('Received Request Status:', s);
    //   Urusai.Verbose('Received Request Data:', d);
    // })

    // setTimeout(() => {

    //   Master.Send({
    //     Action: 'CONTROL',
    //     Message: 'TOKEI_REPORT',
    //     Data: {
    //     }
    //   });
    // }, 10000);
  })();
}