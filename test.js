// const c = require('cheerio');
// const { readFileSync } = require('fs');
// const $ = c.load(readFileSync('./test.stash.html'));

// console.log($('form section div[id^=shop-main] .total-postage').map((i, v )=> v).toArray())

const varMatched = 'xxx(${yyy.zzz})'.match(/\${([a-z0-9_\.]+)}/ig);
if (varMatched) {
  for (const varExpression of varMatched) {
    const parsedKey = eval(varExpression.replace(/^\${([a-z0-9_]+)([a-z0-9_\.]+)}$/i, '(this.FlowZone["$1"] || this.Session["$1"])$2'));
    varMatched.replace(varExpression, parsedKey)
  }
}
