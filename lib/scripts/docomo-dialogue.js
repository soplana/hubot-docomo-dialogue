// Description
//   A Hubot script that calls the docomo dialogue API
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_DOCOMO_DIALOGUE_P
//   HUBOT_DOCOMO_DIALOGUE_API_KEY
//
// Commands:
//   * - calls the docomo dialogue API
//
// Author:
//   bouzuya <m@bouzuya.net>
//
module.exports = function(robot) {
  robot.brain.data.dialogue = {};
  return robot.respond(/.*/i, function(res) {
    var ctx, p, payload, ref, room_id;
    payload = {
      utt: res.match[0],
      nickname: res.message.user.name
    };
    room_id = res.message.user.reply_to || res.message.user.room;
    if (ctx = robot.brain.data.dialogue[room_id]) {
      payload.context = ctx.context;
      payload.mode = ctx.mode;
    }
    return res.http('https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue').header('Content-Type', 'application/json').query({
      APIKEY: process.env.HUBOT_DOCOMO_DIALOGUE_API_KEY
    }).post(JSON.stringify(payload))(function(err, _, body) {
      var data;
      if (err != null) {
        robot.logger.error(e);
        return res.send('docomo-dialogue: error');
      } else {
        data = JSON.parse(body);
        var say = data.utt;
        say = say.replace(/ー{1,2}[。|、]|ー{1,2}$/g,"。");
        say = say.replace(/ください|下さい/g,"");
        say = say.replace(/んです/g, 'の').replace(/ですか|ですよ|ですね|です/g, 'よ');
        say = say.replace(/そうですよ|そうですね|そうです/g, 'そうだよ').replace(/[の|ん]ですが/g, "んだけど").replace(/でしょうか/g, "かな");
        say = say.replace(/ましたか/g,"たの").replace(/[ん|の]ですか/g,"の").replace(/しますか/g, "するの").replace(/ますか/g,"るの");

        if(say.match(/[。|！|？|!|\?]$/)){
          say = say.replace(/[。|？|！|!|\?]{1,3}/, function(a){return a.substr(0,1)}).replace(/！|!/g, '...').replace(/。|？|\?/g, function(a){ return "..."+a});
        }else{
          say = say + "...";
        };

        res.send(say);
        return robot.brain.data.dialogue[room_id] = {
          context: data.context,
          mode: data.mode
        };
      }
    });
  });
};
