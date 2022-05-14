function sendMsg(msg){
    return new Promise(async (res,rej)=>{
        try{
            console.log("nofifyUser::sendMsg==>",msg)
            const msgBody = JSON.parse(msg);
            WAPI.sendMessage2('91' + msgBody.phoneNo + '@c.us', msgBody.msg);
        }catch(err){
            console.log("An error occured while sending msg", err.message);
            rej();
        }
    })
}
// function sendMsg(msg) {
//     return new Promise(async (res, rej) => {
//         try {
//             console.log('msg body==>', msg);
//             const msgBody = JSON.parse(msg);
//             url = `https://web.whatsapp.com/send?phone=91${msgBody.phoneNo}&text=${msgBody.msg}`;
//             console.log('url===>', url);
//             page = global.page;
//             await page.goto(url);
//             await page.waitForXPath("//div[contains(text(),'Search or start new chat')]");
//             spanList = await page.$$("span[data-icon]");
//             await page.$$eval("span[data-icon]", el => el.map(x => {
//                 if (x.getAttribute("data-icon") === 'send') {
//                     x.click();
//                 }
//             }));
//             res();
//         } catch (err) {
//             console.log("An error occured while sending msg", err.message);
//             rej();
//         }
//     })
// }
module.exports = {
    sendMsg
}