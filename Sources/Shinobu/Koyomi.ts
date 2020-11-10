import { createServer, IncomingMessage, ServerResponse } from "http";
import { Jinja } from "../Common/Jinja/Jinja";
import { Urusai } from "../Common/Urusai/Urusai";
import { Agent } from "./Kokorowatari/Agent";
import { Master } from "./Kokorowatari/Agent/Master";
import { Table } from "./Kokorowatari/Agent/Rule";

/**
 * A ultra simple HTTP server
 */
export class Koyomi {

  private static __Responses: Table<ServerResponse> = {};

  public static async Initialize(): Promise<void> {

    Urusai.Verbose(`
 _   __                            _ 
 | | / /                           (_)
 | |/ /  ___  _   _  ___  _ __ ___  _ 
 |    \\ / _ \\| | | |/ _ \\| '_ \` _ \\| |
 | |\\  \\ (_) | |_| | (_) | | | | | | |
 \\_| \\_/\\___/ \\__, |\\___/|_| |_| |_|_|
               __/ |                  
              |___/                   
 `);

    await this.__Callback();
    await this.__Server();
  }

  private static async __Callback() {
    Master.Callback((s, r, d) => {

      if (!(r in this.__Responses)) return;

      const response = this.__Responses[r];
      delete this.__Responses[r];

      if (1 == s) {
        response.writeHead(500, 'Koyomi Failure');
        response.end();
        return;
      }

      response.writeHead(200, 'Koyomi Success');
      response.end(JSON.stringify(d));
    })
  }

  private static async __Server() {
    createServer(async (q, p) => await this.__Process(q, p)).listen(Jinja.Get('Koyomi.Port'));
    Urusai.Verbose('Koyomi here, Serve you at http://127.0.0.1:' + Jinja.Get('Koyomi.Port'));
  }

  private static async __Process(q: IncomingMessage, p: ServerResponse) {

    var jsonData = "";
    q.on('data', (chunk) => jsonData += chunk);
    q.on('end', async () => {

      if ('/' == q.url) return p.end();

      Urusai.Verbose('Calling flow', q.url!.substr(1), 'using data', jsonData);

      try {
        var requestData = JSON.parse(jsonData);
        p.setTimeout(Jinja.Get('Koyomi.Timeout'), () => {
          Urusai.Warning('Timeout when processing request');
          p.writeHead(504, 'Koyomi Timeout');
          p.end();
        });

        const requestId = await Master.Perform(q.url!.substr(1), requestData);
        if (!requestId) {
          Urusai.Error('Cannot create request');
          throw '';
        }

        this.__Responses[requestId] = p;
      } catch {
        Urusai.Error('Something went wrong when processing request');
        p.end();
      }
      // p.writeHead(200);
      // p.end(JSON.stringify(resObj));
    });
  }

}