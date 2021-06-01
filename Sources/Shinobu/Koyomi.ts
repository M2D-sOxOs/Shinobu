import { createHash } from "crypto";
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

  private static __Responses: Table<ServerResponse[]> = {};

  /**
   * Using Request ID to find Hash
   */
  private static __RequestHash: Table<string> = {};

  /**
   * Using Request Hash to find ID
   */
  private static __HashRequest: Table<string> = {};

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
      Urusai.Verbose('Kokomi Callback received.')

      if (!(r in this.__Responses)) {
        Urusai.Error('Response not found, this may be a bug', r);
        return;
      }

      const responses = this.__Responses[r];
      delete this.__Responses[r];
      delete this.__HashRequest[this.__RequestHash[r]];
      delete this.__RequestHash[r];

      if (1 == s) {
        responses.forEach(r => {
          r.writeHead(500, 'Koyomi Failure');
          r.end();
        });
        return;
      }

      responses.forEach(r => {
        r.writeHead(200, 'Koyomi Success');
        r.end(JSON.stringify(d));
      });
    })
  }

  private static async __Server() {
    createServer((q, p) => this.__Process(q, p)).listen(Jinja.Get('Koyomi.Port'));
    Urusai.Verbose('Koyomi here, Serve you at http://127.0.0.1:' + Jinja.Get('Koyomi.Port'));
  }

  private static __Process(q: IncomingMessage, p: ServerResponse) {

    var jsonData = "";
    q.on('data', (chunk) => jsonData += chunk);
    q.on('end', async () => {

      if ('/' == q.url) return p.end();

      const flowName = q.url!.substr(1);
      Urusai.Verbose('Calling flow', flowName, 'using data', jsonData);

      try {
        const reqHash = createHash('md5').update(flowName + '-' + jsonData).digest().toString('hex');

        p.setTimeout(Jinja.Get('Koyomi.Timeout'), () => {
          Urusai.Warning('Timeout when processing request');
          p.writeHead(504, 'Koyomi Timeout');
          p.end();
        });

        // Already in request
        if (reqHash in this.__HashRequest) {
          Urusai.Verbose('Merged request of', reqHash);
          const pendingRequestId = this.__HashRequest[reqHash];
          this.__Responses[pendingRequestId] = this.__Responses[pendingRequestId] || [];
          this.__Responses[pendingRequestId].push(p);
          return;
        }

        var requestData = JSON.parse(jsonData);

        const requestId = await Master.Perform(flowName, requestData);
        Urusai.Notice('Request:', requestId);
        if (!requestId) {
          Urusai.Error('Cannot create request');
          throw '';
        }

        if (Jinja.Get('Koyomi.Merge')) {
          this.__HashRequest[reqHash] = requestId;
          this.__RequestHash[requestId] = reqHash;
        }
        this.__Responses[requestId] = [p];
      } catch (e) {
        console.log(e);
        Urusai.Error('Something went wrong when processing request');
        p.end();
      }
      // p.writeHead(200);
      // p.end(JSON.stringify(resObj));
    });
  }

}